# ZeroShare - Cloud Native End-to-End Encrypted File Sharing

ZeroShare is a secure, serverless file sharing application built on Cloudflare Workers, R2, and KV. It features client-side encryption (AES-256-GCM), ensuring that the server never sees the unencrypted file content or the encryption keys.

## Features

- **End-to-End Encryption**: Files are encrypted in the browser before upload. Keys are generated locally and shared via the URL fragment (never sent to the server).
- **Serverless Architecture**: Powered by Cloudflare Workers (Compute), R2 (Storage), and KV (Metadata).
- **Access Control**:
  - Password protection.
  - Expiration time (1 hour, 24 hours).
  - View limits (e.g., 1 view only for Burn after read).
- **Zero Knowledge**: The server stores only encrypted blobs.

## Prerequisites

- [Node.js](https://nodejs.org/) installed.
- [Cloudflare Account](https://dash.cloudflare.com/sign-up).
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (`npm install -g wrangler`).

## Setup Guide

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ZeroShare
npm install
```

### 2. Cloudflare Resources Setup

You need to create an R2 bucket and a KV namespace.

**Step 2.1: Login to Cloudflare**

```bash
wrangler login
```

**Step 2.2: Create R2 Bucket**

Create a bucket named `secure-share-files`:

```bash
wrangler r2 bucket create secure-share-files
```

**Step 2.3: Create KV Namespace**

Create a KV namespace for metadata:

```bash
wrangler kv:namespace create METADATA_KV
```

This command will output something like:

```
{ binding = "METADATA_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**Step 2.4: Update Configuration**

Open `wrangler.toml` and replace the placeholder `id` with the one you just generated.

```toml
[[kv_namespaces]]
binding = "METADATA_KV"
id = "YOUR_GENERATED_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE" # Optional: Run 'wrangler kv:namespace create METADATA_KV --preview' to get this
```

### 3. Configure Lifecycle Rules (Optional but Recommended)

To automatically delete expired files from R2, you can set up a lifecycle rule.

Create a file named `lifecycle.json`:

```json
{
  "Rules": [
    {
      "Id": "DeleteExpiredShares",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "shares/"
      },
      "Expiration": {
        "Days": 2
      }
    }
  ]
}
```

Apply it:

```bash
wrangler r2 bucket lifecycle set secure-share-files --file lifecycle.json
```

*Note: The application also includes a Cron Trigger to clean up expired files and metadata more precisely.*

## Development

Start the local development server:

```bash
npm start
# or
wrangler dev
```

Visit `http://localhost:8787` to test.

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
# or
wrangler deploy
```

Your application will be available at `https://secure-share.<your-subdomain>.workers.dev`.


## Security Model

1.  **Key Generation**: `crypto.subtle.generateKey` creates a 256-bit AES-GCM key in the browser.
2.  **Encryption**: File content and metadata are encrypted with this key.
3.  **Upload**: The encrypted blobs are sent to the Worker. The key is **NOT** sent.
4.  **Sharing**: The key is appended to the share URL as a hash fragment (`#key`). Hash fragments are never sent to the server.
5.  **Download**: The browser fetches the encrypted blobs, extracts the key from the URL hash, and decrypts the content locally.

## License

MIT
