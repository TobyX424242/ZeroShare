import { jsonResponse } from '../utils/response.js';
import { verifyPassword } from '../utils/crypto.js';
import { arrayBufferToBase64 } from '../utils/encoding.js';
import { StorageService } from '../services/storage.js';

export async function handleDownload(request, env, shareId) {
  try {
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

    // Check mode (metadata only)
    if (url.searchParams.get('check') === 'true') {
      return jsonResponse({
        exists: true,
        passwordRequired: !!accessControl.passwordHash,
        expiresAt: new Date(accessControl.expiresAt).toISOString(),
        viewsRemaining: accessControl.accessControl.maxViews === -1 ? -1 : (accessControl.accessControl.maxViews - accessControl.accessControl.currentViews)
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
    return new Response(r2Object.body, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'X-Encrypted-Metadata': r2Object.customMetadata.encryptedMetadata,
            'X-Original-Content-Type': r2Object.customMetadata.contentType || 'application/octet-stream',
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
