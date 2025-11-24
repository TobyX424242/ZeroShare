export const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZeroShare - Secure File Sharing</title>
    <style>
        :root {
            --bg: #09090b;
            --surface: #18181b;
            --border: #27272a;
            --text: #fafafa;
            --text-muted: #a1a1aa;
            --primary: #fafafa;
            --primary-fg: #09090b;
            --error: #ef4444;
            --success: #22c55e;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: var(--surface);
            padding: 2rem;
            border-radius: 12px;
            border: 1px solid var(--border);
            width: 100%;
            max-width: 480px;
        }
        h1 { margin-top: 0; font-size: 1.5rem; text-align: center; color: var(--text); letter-spacing: -0.025em; }
        .hidden { display: none; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; color: var(--text-muted); }
        input[type="text"], input[type="password"], input[type="number"], textarea, select {
            width: 100%;
            padding: 0.75rem;
            background-color: var(--bg);
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--text-muted);
        }
        button {
            width: 100%;
            padding: 0.75rem;
            background-color: var(--primary);
            color: var(--primary-fg);
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            transition: opacity 0.2s;
        }
        button:hover { opacity: 0.9; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary {
            background-color: var(--bg);
            color: var(--text);
            border: 1px solid var(--border);
        }
        .btn-secondary:hover {
            background-color: var(--border);
        }
        .file-drop {
            border: 2px dashed var(--border);
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background-color: rgba(255,255,255,0.02);
        }
        .file-drop:hover, .file-drop.dragover { 
            border-color: var(--text-muted); 
            background-color: rgba(255,255,255,0.05); 
        }
        .result-box {
            margin-top: 1rem;
            padding: 1rem;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            word-break: break-all;
            font-family: monospace;
            font-size: 0.9rem;
            color: var(--text-muted);
        }
        .error { color: var(--error); font-size: 0.9rem; margin-top: 0.5rem; }
        .tabs { display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
        .tab { 
            padding: 0.5rem 0; 
            cursor: pointer; 
            border-bottom: 2px solid transparent; 
            color: var(--text-muted);
            transition: color 0.2s;
        }
        .tab:hover { color: var(--text); }
        .tab.active { 
            border-bottom-color: var(--primary); 
            color: var(--text); 
            font-weight: 500; 
        }
        #preview-content { margin-top: 1rem; max-height: 300px; overflow: auto; }
        #preview-content img { max-width: 100%; border-radius: 4px; }
        
        /* Toast Notifications */
        #toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .toast {
            background: var(--surface);
            color: var(--text);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid var(--border);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            border-left: 4px solid var(--primary);
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            min-width: 250px;
            font-size: 0.9rem;
        }
        .toast.error { border-left-color: var(--error); }
        .toast.success { border-left-color: var(--success); }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ZeroShare</h1>
        
        <!-- Upload Section -->
        <div id="upload-section">
            <div class="tabs">
                <div class="tab active" onclick="switchTab('file')">File</div>
                <div class="tab" onclick="switchTab('text')">Text</div>
            </div>

            <div id="file-tab">
                <div class="file-drop" id="drop-zone" onclick="document.getElementById('file-input').click()">
                    <p>Click or drag file here</p>
                    <input type="file" id="file-input" hidden onchange="handleFileSelect(this.files[0])">
                </div>
                <p id="selected-file" style="text-align: center; font-size: 0.9rem; margin-top: 0.5rem;"></p>
            </div>

            <div id="text-tab" class="hidden">
                <textarea id="text-input" rows="5" placeholder="Paste your secret text here..."></textarea>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
                <label>Security Options</label>
                
                <div style="position: relative; margin-bottom: 0.5rem;">
                    <input type="password" id="upload-password" placeholder="Password (Optional)" style="padding-right: 40px;">
                    <span onclick="togglePassword('upload-password')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; user-select: none;">👁️</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div>
                        <label style="font-size: 0.8rem; margin-bottom: 0.2rem;">Expires in (Hours)</label>
                        <input type="number" id="expires-in" value="24" min="1" max="24" oninput="if(parseInt(this.value) > 24) this.value = 24;">
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; margin-bottom: 0.2rem;">Max Views (0 = Unlimited)</label>
                        <input type="number" id="max-views" placeholder="Unlimited" min="0">
                    </div>
                </div>
            </div>

            <button id="upload-btn" onclick="upload()">Encrypt & Share</button>
            <div id="upload-error" class="error"></div>
            
            <div id="share-result" class="hidden">
                <p>Share this link (Key is in the URL anchor):</p>
                <div class="result-box" id="share-link"></div>
                <button onclick="copyLink()" class="btn-secondary" style="margin-top: 0.5rem;">Copy Link</button>
                <div id="qrcode" style="margin-top: 1rem; display: flex; justify-content: center; padding: 1rem; background: white; border-radius: 8px;"></div>
            </div>
        </div>

        <!-- Download Section -->
        <div id="download-section" class="hidden">
            <p id="download-status">Encrypted content found.</p>
            
            <div id="password-prompt" class="hidden form-group">
                <label>Password Required</label>
                <div style="position: relative;">
                    <input type="password" id="download-password" placeholder="Enter password" style="padding-right: 40px;">
                    <span onclick="togglePassword('download-password')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; user-select: none;">👁️</span>
                </div>
            </div>

            <button id="download-btn" onclick="downloadOrPreview()">Decrypt & View</button>
            <div id="download-error" class="error"></div>

            <div id="preview-area" class="hidden">
                <h3>Content Preview</h3>
                <div id="preview-content" class="result-box"></div>
                <button id="save-file-btn" onclick="saveFile()" style="margin-top: 1rem;">Save File</button>
            </div>
        </div>
    </div>

    <div id="toast-container"></div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
        // --- Toast Utils ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = \`toast \${type}\`;
            toast.innerText = message;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // --- Crypto Utils ---
        async function generateEncryptionKey() {
            return await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true, ["encrypt", "decrypt"]
            );
        }

        async function exportKeyToBase64(key) {
            const exported = await crypto.subtle.exportKey("raw", key);
            return arrayBufferToBase64(exported);
        }

        async function importKeyFromBase64(base64Key) {
            const keyBuffer = base64ToArrayBuffer(base64Key);
            return await crypto.subtle.importKey(
                "raw", keyBuffer,
                { name: "AES-GCM", length: 256 },
                true, ["encrypt", "decrypt"]
            );
        }

        async function encryptData(key, data) {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key, data
            );
            return { ciphertext, iv };
        }

        async function decryptData(key, ciphertext, iv) {
            return await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key, ciphertext
            );
        }

        function combineIvAndCiphertext(iv, ciphertext) {
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(ciphertext), iv.length);
            return combined.buffer;
        }

        function separateIvAndCiphertext(combined) {
            const iv = new Uint8Array(combined.slice(0, 12));
            const ciphertext = combined.slice(12);
            return { iv, ciphertext };
        }

        function arrayBufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
            return btoa(binary);
        }

        function base64ToArrayBuffer(base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
            return bytes.buffer;
        }

        // --- UI Logic ---
        let selectedFile = null;
        let currentMode = 'file';
        let decryptedBlob = null;
        let decryptedMeta = null;

        function togglePassword(id) {
            const input = document.getElementById(id);
            if (input.type === "password") {
                input.type = "text";
            } else {
                input.type = "password";
            }
        }

        // Init
        window.onload = async () => {
            const path = window.location.pathname;
            if (path.startsWith('/share/')) {
                document.getElementById('upload-section').classList.add('hidden');
                document.getElementById('download-section').classList.remove('hidden');
                
                // Check for key in hash
                if (!window.location.hash || window.location.hash.length < 2) {
                    document.getElementById('download-status').innerText = "Error: Missing decryption key in URL.";
                    document.getElementById('download-btn').disabled = true;
                    return;
                }

                // Auto-detect password requirement
                try {
                    const shareId = path.split('/')[2];
                    const res = await fetch(\`/api/share/\${shareId}?check=true\`);
                    if (res.status === 404 || res.status === 410) {
                         const data = await res.json();
                         throw new Error(data.error || 'Share not found');
                    }
                    const info = await res.json();
                    if (info.passwordRequired) {
                        document.getElementById('password-prompt').classList.remove('hidden');
                    }
                    if (info.viewsRemaining !== -1) {
                         document.getElementById('download-status').innerText = \`Encrypted content found. \${info.viewsRemaining} view(s) remaining.\`;
                    }
                } catch (e) {
                    document.getElementById('download-status').innerText = e.message;
                    document.getElementById('download-btn').disabled = true;
                    document.getElementById('download-btn').classList.add('hidden');
                }
            }
            
            // Drag & Drop
            const dropZone = document.getElementById('drop-zone');
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
            });
        };

        function switchTab(tab) {
            currentMode = tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            if (tab === 'file') {
                document.getElementById('file-tab').classList.remove('hidden');
                document.getElementById('text-tab').classList.add('hidden');
            } else {
                document.getElementById('file-tab').classList.add('hidden');
                document.getElementById('text-tab').classList.remove('hidden');
            }
        }

        function handleFileSelect(file) {
            selectedFile = file;
            document.getElementById('selected-file').innerText = file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)';
        }

        async function upload() {
            const btn = document.getElementById('upload-btn');
            const errorDiv = document.getElementById('upload-error');
            btn.disabled = true;
            btn.innerText = 'Encrypting...';
            errorDiv.innerText = '';

            try {
                // 1. Prepare Data
                let dataToEncrypt;
                let metadata;

                if (currentMode === 'file') {
                    if (!selectedFile) throw new Error("Please select a file");
                    dataToEncrypt = await selectedFile.arrayBuffer();
                    metadata = {
                        type: 'file',
                        mimeType: selectedFile.type,
                        filename: selectedFile.name,
                        size: selectedFile.size,
                        uploadedAt: Date.now()
                    };
                } else {
                    const text = document.getElementById('text-input').value;
                    if (!text) throw new Error("Please enter some text");
                    dataToEncrypt = new TextEncoder().encode(text);
                    metadata = {
                        type: 'text',
                        mimeType: 'text/markdown',
                        filename: 'secret.txt',
                        size: dataToEncrypt.byteLength,
                        uploadedAt: Date.now()
                    };
                }

                // 2. Encrypt
                const key = await generateEncryptionKey();
                const keyBase64 = await exportKeyToBase64(key);

                const { ciphertext, iv } = await encryptData(key, dataToEncrypt);
                const combinedData = combineIvAndCiphertext(iv, ciphertext);

                const metadataJson = JSON.stringify(metadata);
                const metaEnc = await encryptData(key, new TextEncoder().encode(metadataJson));
                const combinedMeta = combineIvAndCiphertext(metaEnc.iv, metaEnc.ciphertext);

                // 3. Upload
                btn.innerText = 'Uploading...';
                const password = document.getElementById('upload-password').value;
                
                let maxViewsInput = document.getElementById('max-views').value;
                let maxViews = -1;
                if (maxViewsInput && parseInt(maxViewsInput) > 0) {
                    maxViews = parseInt(maxViewsInput);
                }

                let expiresInInput = document.getElementById('expires-in').value;
                let expiresIn = 24;
                if (expiresInInput) {
                    const val = parseInt(expiresInInput);
                    if (val > 24) throw new Error("Expiration time cannot exceed 24 hours");
                    if (val > 0) expiresIn = val;
                }

                const payload = {
                    encryptedData: arrayBufferToBase64(combinedData),
                    encryptedMetadata: arrayBufferToBase64(combinedMeta),
                    contentType: metadata.type === 'text' ? 'text/plain' : 'application/octet-stream',
                    accessControl: {
                        password: password || null,
                        maxViews: maxViews,
                        burnAfterRead: maxViews === 1,
                        expiresIn: expiresIn
                    }
                };

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Upload failed');

                // 4. Show Result
                const shareUrl = \`\${window.location.origin}/share/\${result.shareId}#\${keyBase64}\`;
                document.getElementById('share-link').innerText = shareUrl;
                document.getElementById('share-result').classList.remove('hidden');
                
                // Generate QR Code
                document.getElementById('qrcode').innerHTML = '';
                new QRCode(document.getElementById("qrcode"), {
                    text: shareUrl,
                    width: 128,
                    height: 128,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });

                btn.innerText = 'Done';
                showToast('File encrypted and uploaded successfully!', 'success');

            } catch (e) {
                console.error(e);
                errorDiv.innerText = e.message;
                btn.disabled = false;
                btn.innerText = 'Encrypt & Share';
                showToast(e.message, 'error');
            }
        }

        function copyLink() {
            const text = document.getElementById('share-link').innerText;
            navigator.clipboard.writeText(text);
            showToast('Link copied to clipboard!', 'success');
        }

        async function downloadOrPreview() {
            const btn = document.getElementById('download-btn');
            const errorDiv = document.getElementById('download-error');
            btn.disabled = true;
            errorDiv.innerText = '';

            try {
                const shareId = window.location.pathname.split('/')[2];
                const keyBase64 = window.location.hash.substring(1);
                const password = document.getElementById('download-password').value;

                // 1. Fetch
                const params = new URLSearchParams();
                if (password) params.set('password', password);
                
                const res = await fetch(\`/api/share/\${shareId}?\${params}\`);
                const data = await res.json();

                if (res.status === 401 || (data.code === 'PASSWORD_REQUIRED')) {
                    document.getElementById('password-prompt').classList.remove('hidden');
                    btn.disabled = false;
                    if (res.status === 401) throw new Error("Password required");
                }
                
                if (!res.ok) throw new Error(data.error || 'Download failed');

                // 2. Decrypt
                const key = await importKeyFromBase64(keyBase64);

                // Decrypt Metadata
                const metaBuf = base64ToArrayBuffer(data.encryptedMetadata);
                const { iv: metaIv, ciphertext: metaCipher } = separateIvAndCiphertext(metaBuf);
                const decMetaBuf = await decryptData(key, metaCipher, metaIv);
                const metadata = JSON.parse(new TextDecoder().decode(decMetaBuf));
                decryptedMeta = metadata;

                // Decrypt Data
                const dataBuf = base64ToArrayBuffer(data.encryptedData);
                const { iv: dataIv, ciphertext: dataCipher } = separateIvAndCiphertext(dataBuf);
                const decDataBuf = await decryptData(key, dataCipher, dataIv);
                
                decryptedBlob = new Blob([decDataBuf], { type: metadata.mimeType });

                // 3. Show Content
                document.getElementById('preview-area').classList.remove('hidden');
                document.getElementById('download-btn').classList.add('hidden');
                document.getElementById('password-prompt').classList.add('hidden');

                const previewDiv = document.getElementById('preview-content');
                
                if (metadata.type === 'text') {
                    const text = new TextDecoder().decode(decDataBuf);
                    previewDiv.innerHTML = marked.parse(text);
                } else if (metadata.mimeType.startsWith('image/')) {
                    const url = URL.createObjectURL(decryptedBlob);
                    previewDiv.innerHTML = \`<img src="\${url}" alt="Preview">\`;
                } else {
                    previewDiv.innerText = \`File: \${metadata.filename} (\${(metadata.size/1024).toFixed(1)} KB)\nPreview not available for this file type.\`;
                }

                if (data.isLastView) {
                    showToast("This was the last view allowed. The file has been deleted from the server.", 'info');
                }

            } catch (e) {
                console.error(e);
                errorDiv.innerText = e.message;
                btn.disabled = false;
                showToast(e.message, 'error');
            }
        }

        function saveFile() {
            if (!decryptedBlob || !decryptedMeta) return;
            const url = URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = decryptedMeta.filename;
            a.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
