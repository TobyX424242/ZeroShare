import { jsonResponse } from '../utils/response.js';
import { hashPassword } from '../utils/crypto.js';
import { base64ToArrayBuffer } from '../utils/encoding.js';
import { StorageService } from '../services/storage.js';

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
    
    // Calculate expiration
    const expiresIn = Math.min(accessControlPayload.expiresIn || 24, 24);
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    
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
      passwordHash: accessControlPayload.password 
        ? await hashPassword(accessControlPayload.password)
        : null,
      accessControl: {
        maxViews: accessControlPayload.maxViews,
        currentViews: 0,
        burnAfterRead: accessControlPayload.burnAfterRead
      },
      expiresAt: expiresAt.getTime(),
      r2ObjectKey: r2Key,
      createdAt: Date.now()
    };
    
    await storage.saveMetadata(shareId, accessControl, expiresIn * 3600);
    
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
