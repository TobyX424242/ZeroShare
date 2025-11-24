import { jsonResponse } from '../utils/response.js';
import { verifyPassword } from '../utils/crypto.js';
import { StorageService } from '../services/storage.js';

const SHARE_ID_PATTERN = /^[a-f0-9]{32}$/i;

export async function handleDownload(request, env, shareId) {
  try {
    if (!SHARE_ID_PATTERN.test(shareId || '')) {
      return jsonResponse({ error: 'Invalid share identifier' }, 400);
    }

    const storage = new StorageService(env);
    
    // 1. Get access control from KV
    const accessControl = await storage.getMetadata(shareId);
    
    if (!accessControl) {
      return jsonResponse({ error: 'Share not found or expired' }, 404);
    }
    
    // 2. Check expiration
    if (Date.now() > accessControl.expiresAt) {
      await Promise.all([
        storage.deleteFile(accessControl.r2ObjectKey),
        storage.deleteMetadata(shareId)
      ]);
      return jsonResponse({ error: 'Share has expired' }, 410);
    }

    const url = new URL(request.url);

    const sanitizedAccessSettings = sanitizeStoredAccessControl(accessControl.accessControl);
    accessControl.accessControl = sanitizedAccessSettings;

    // Check mode (metadata only)
    if (url.searchParams.get('check') === 'true') {
      return jsonResponse({
        exists: true,
        passwordRequired: !!accessControl.passwordHash,
        expiresAt: new Date(accessControl.expiresAt).toISOString(),
        viewsRemaining: calculateViewsRemaining(accessControl.accessControl)
      });
    }
    
    // 3. Verify password
    const providedPassword = url.searchParams.get('password');
    
    if (accessControl.passwordHash) {
      if (!providedPassword) {
        return jsonResponse({ error: 'Password required', code: 'PASSWORD_REQUIRED' }, 401);
      }
      
      const passwordValid = await verifyPassword(
        providedPassword,
        accessControl.passwordHash
      );
      
      if (!passwordValid) {
        return jsonResponse({ error: 'Invalid password', code: 'INVALID_PASSWORD' }, 403);
      }
    }
    
    // 4. Check view limits
    if (accessControl.accessControl.maxViews !== -1) {
      if (accessControl.accessControl.currentViews >= 
          accessControl.accessControl.maxViews) {
        await Promise.all([
          storage.deleteFile(accessControl.r2ObjectKey),
          storage.deleteMetadata(shareId)
        ]);
        return jsonResponse({ error: 'View limit exceeded' }, 410);
      }
    }
    
    // 5. Get data from R2
    const r2Object = await storage.getFile(accessControl.r2ObjectKey);
    
    if (!r2Object) {
      // Inconsistency between KV and R2
      await storage.deleteMetadata(shareId);
      return jsonResponse({ error: 'File not found' }, 404);
    }
    
    // 6. Update view count
    accessControl.accessControl.currentViews++;
    
    // 7. Check if should delete (Burn after read or max views reached)
    const shouldDelete = 
      accessControl.accessControl.burnAfterRead ||
      (accessControl.accessControl.maxViews !== -1 &&
       accessControl.accessControl.currentViews >= 
       accessControl.accessControl.maxViews);
    
    if (shouldDelete) {
      // Note: We delete asynchronously. If the download fails mid-stream, the file is still gone.
      // This is a trade-off for "burn after read" security.
      await Promise.all([
        storage.deleteFile(accessControl.r2ObjectKey),
        storage.deleteMetadata(shareId)
      ]);
    } else {
      // Update KV
      await storage.saveMetadata(
        shareId, 
        accessControl, 
        Math.floor((accessControl.expiresAt - Date.now()) / 1000)
      );
    }
    
    // 8. Return stream
    const objectMetadata = r2Object.customMetadata || {};

    return new Response(r2Object.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Encrypted-Metadata': objectMetadata.encryptedMetadata || '',
        'X-Original-Content-Type': objectMetadata.contentType || 'application/octet-stream',
        'X-Is-Last-View': shouldDelete ? 'true' : 'false',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Encrypted-Metadata, X-Original-Content-Type, X-Is-Last-View'
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return jsonResponse({ error: 'Download failed' }, 500);
  }
}

function sanitizeStoredAccessControl(accessControl = {}) {
  const rawMaxViews = accessControl.maxViews;
  let maxViews = -1;
  if (rawMaxViews === -1) {
    maxViews = -1;
  } else {
    const numericMax = Number(rawMaxViews);
    if (Number.isFinite(numericMax) && numericMax > 0) {
      maxViews = numericMax;
    }
  }

  const currentViewsNumeric = Number(accessControl.currentViews);
  const currentViews = Number.isFinite(currentViewsNumeric) && currentViewsNumeric > 0
    ? currentViewsNumeric
    : 0;

  return {
    maxViews,
    currentViews,
    burnAfterRead: Boolean(accessControl.burnAfterRead)
  };
}

function calculateViewsRemaining(accessControl) {
  if (accessControl.maxViews === -1) {
    return -1;
  }

  return Math.max(0, accessControl.maxViews - accessControl.currentViews);
}
