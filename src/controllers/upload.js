import { jsonResponse } from '../utils/response.js';
import { hashPassword } from '../utils/crypto.js';
import { base64ToArrayBuffer } from '../utils/encoding.js';
import { StorageService } from '../services/storage.js';

const DEFAULT_MAX_RETENTION_HOURS = 24;
const DEFAULT_MAX_VIEWS_LIMIT = 50;
const MAX_PASSWORD_LENGTH = 512;
const MIN_TTL_SECONDS = 60;
const MAX_METADATA_LENGTH = 8192;

function generateShareId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function handleUpload(request, env) {
  try {
    const storage = new StorageService(env);
    const shareId = generateShareId();
    const r2Key = `shares/${shareId}.bin`;
    
    let encryptedData;
    let encryptedMetadata;
    let accessControlPayload;
    let originalContentType;

    const contentType = request.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
        // Legacy JSON mode
        const payload = await request.json();
        if (!payload.encryptedData || !payload.encryptedMetadata) {
            return jsonResponse({ error: 'Missing required fields' }, 400);
        }
        encryptedData = base64ToArrayBuffer(payload.encryptedData);
        encryptedMetadata = payload.encryptedMetadata;
        accessControlPayload = payload.accessControl;
        originalContentType = payload.contentType;
    } else {
        // Streaming mode
        encryptedData = request.body;
        encryptedMetadata = request.headers.get('X-Encrypted-Metadata');
        const accessControlStr = request.headers.get('X-Access-Control');
        originalContentType = request.headers.get('X-Original-Content-Type');
        
        if (!encryptedMetadata || !accessControlStr) {
             return jsonResponse({ error: 'Missing required headers' }, 400);
        }
        
        // Decode access control (Base64 -> JSON)
        try {
            accessControlPayload = JSON.parse(atob(accessControlStr));
        } catch (e) {
            return jsonResponse({ error: 'Invalid Access Control Header' }, 400);
        }
    }

    if (!accessControlPayload || typeof accessControlPayload !== 'object') {
      return jsonResponse({ error: 'Invalid access control payload' }, 400);
    }

    if (encryptedMetadata && encryptedMetadata.length > MAX_METADATA_LENGTH) {
      return jsonResponse({ error: 'Encrypted metadata exceeds maximum size' }, 400);
    }

    const passwordValidation = validatePassword(accessControlPayload.password);
    if (passwordValidation.error) {
      return jsonResponse({ error: passwordValidation.error }, 400);
    }

    const sanitizedAccessControlResult = sanitizeAccessControlInput(accessControlPayload, env);
    if (sanitizedAccessControlResult.error) {
      return jsonResponse({ error: sanitizedAccessControlResult.error }, 400);
    }
    const sanitizedAccessControl = sanitizedAccessControlResult.value;
    
    // Calculate expiration
    const expiresInHours = sanitizedAccessControl.expiresInHours;
    const expiresInSeconds = Math.max(
      MIN_TTL_SECONDS,
      Math.floor(expiresInHours * 60 * 60)
    );
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    
    // Prepare R2 metadata
    const r2Metadata = {
      contentType: originalContentType,
      encryptedMetadata: encryptedMetadata,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    // Upload to R2
    await storage.saveFile(r2Key, encryptedData, r2Metadata);
    
    // Store access control in KV
    const accessControl = {
      passwordHash: passwordValidation.value 
        ? await hashPassword(passwordValidation.value)
        : null,
      accessControl: {
        maxViews: sanitizedAccessControl.maxViews,
        currentViews: 0,
        burnAfterRead: sanitizedAccessControl.burnAfterRead
      },
      expiresAt: expiresAt.getTime(),
      r2ObjectKey: r2Key,
      createdAt: Date.now()
    };
    
    await storage.saveMetadata(shareId, accessControl, expiresInSeconds);
    
    return jsonResponse({
      success: true,
      shareId,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({ error: 'Upload failed: ' + error.message }, 500);
  }
}

function sanitizeAccessControlInput(payload = {}, env = {}) {
  const maxRetentionHours = Number(env.MAX_RETENTION_HOURS) || DEFAULT_MAX_RETENTION_HOURS;
  const maxViewsLimit = Number(env.MAX_VIEWS_LIMIT) || DEFAULT_MAX_VIEWS_LIMIT;

  const defaultRetentionHours = Math.min(DEFAULT_MAX_RETENTION_HOURS, maxRetentionHours);

  let requestedExpires = payload.expiresIn;
  if (requestedExpires == null || requestedExpires === '') {
    requestedExpires = defaultRetentionHours;
  }

  const expiresNumeric = Number(requestedExpires);
  if (!Number.isFinite(expiresNumeric) || expiresNumeric <= 0) {
    return { error: 'Expiration must be greater than 0 hours' };
  }

  const expiresInHours = Math.min(expiresNumeric, maxRetentionHours);

  let maxViews = -1;
  if (payload.maxViews !== undefined && payload.maxViews !== null && payload.maxViews !== '') {
    const maxViewsNumeric = Number(payload.maxViews);

    if (maxViewsNumeric === 0 || maxViewsNumeric === -1) {
      maxViews = -1;
    } else if (Number.isInteger(maxViewsNumeric) && maxViewsNumeric > 0) {
      maxViews = Math.min(maxViewsNumeric, maxViewsLimit);
    } else {
      return { error: 'Max views must be a positive integer or zero for unlimited' };
    }
  }

  return {
    value: {
      expiresInHours,
      maxViews,
      burnAfterRead: Boolean(payload.burnAfterRead)
    }
  };
}

function validatePassword(password) {
  if (password == null || password === '') {
    return { value: null };
  }

  if (typeof password !== 'string') {
    return { error: 'Password must be a string' };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: 'Password is too long' };
  }

  return { value: password };
}
