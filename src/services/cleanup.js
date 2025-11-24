import { StorageService } from './storage.js';

export async function cleanupExpiredShares(env) {
  const now = Date.now();
  const storage = new StorageService(env);
  
  // List shares from KV
  const list = await storage.listShares();
  
  for (const key of list.keys) {
    const data = await env.METADATA_KV.get(key.name);
    if (!data) continue;
    
    try {
      const accessControl = JSON.parse(data);
      
      if (now > accessControl.expiresAt) {
        await storage.deleteFile(accessControl.r2ObjectKey);
        await env.METADATA_KV.delete(key.name);
      }
    } catch (e) {
      console.error(`Failed to cleanup ${key.name}`, e);
    }
  }
}
