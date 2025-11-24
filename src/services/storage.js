export class StorageService {
  constructor(env) {
    this.bucket = env.FILES_BUCKET;
    this.kv = env.METADATA_KV;
  }

  async saveFile(key, data, metadata) {
    await this.bucket.put(key, data, {
      customMetadata: metadata,
      httpMetadata: {
        contentType: 'application/octet-stream'
      }
    });
  }

  async getFile(key) {
    return await this.bucket.get(key);
  }

  async deleteFile(key) {
    await this.bucket.delete(key);
  }

  async saveMetadata(shareId, data, ttl) {
    await this.kv.put(
      `share:${shareId}`,
      JSON.stringify(data),
      { expirationTtl: ttl }
    );
  }

  async getMetadata(shareId) {
    const data = await this.kv.get(`share:${shareId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteMetadata(shareId) {
    await this.kv.delete(`share:${shareId}`);
  }

  async listShares() {
    return await this.kv.list({ prefix: 'share:' });
  }
}
