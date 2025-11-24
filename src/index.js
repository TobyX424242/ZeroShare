import { html } from './views/home.js';
import { handleUpload } from './controllers/upload.js';
import { handleDownload } from './controllers/share.js';
import { cleanupExpiredShares } from './services/cleanup.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API Routes
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      return handleUpload(request, env);
    }
    
    if (url.pathname.startsWith('/api/share/')) {
      const shareId = url.pathname.split('/')[3]; // /api/share/{shareId}
      return handleDownload(request, env, shareId);
    }
    
    // Serve Frontend
    const maxFileSize = env.MAX_FILE_SIZE || 104857600; // Default 100MB
    const maxRetentionHours = env.MAX_RETENTION_HOURS || 24; // Default 24h
    const parsedMaxViewsLimit = Number(env.MAX_VIEWS_LIMIT);
    const maxViewsLimit = Number.isFinite(parsedMaxViewsLimit) && parsedMaxViewsLimit > 0
      ? parsedMaxViewsLimit
      : 50;
    const maxFileSizeMB = Math.round(maxFileSize / 1024 / 1024);

    const finalHtml = html
      .replace(/{{MAX_FILE_SIZE}}/g, maxFileSize)
      .replace(/{{MAX_RETENTION_HOURS}}/g, maxRetentionHours)
      .replace(/{{MAX_FILE_SIZE_MB}}/g, maxFileSizeMB)
      .replace(/{{MAX_VIEWS_LIMIT}}/g, maxViewsLimit);

    return new Response(finalHtml, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  },
  
  // Cron Trigger for cleanup
  async scheduled(event, env, ctx) {
    await cleanupExpiredShares(env);
  }
};
