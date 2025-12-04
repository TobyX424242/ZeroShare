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
            padding: 5rem;
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
        #preview-content video { max-width: 100%; border-radius: 4px; }
        #preview-content audio { width: 100%; }
        
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
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">Max file size: {{MAX_FILE_SIZE_MB}}MB</p>
                    <input type="file" id="file-input" hidden onchange="handleFileSelect(this.files[0])">
                </div>
                <p id="selected-file" style="text-align: center; font-size: 0.9rem; margin-top: 0.5rem;"></p>
            </div>

            <div id="text-tab" class="hidden">
                <textarea id="text-input" rows="15" placeholder="Paste your secret text here..."></textarea>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
                <label>Security Options</label>
                
                <div style="position: relative; margin-bottom: 0.5rem;">
                    <input type="password" id="upload-password" placeholder="Password (Optional)" style="padding-right: 70px;">
                    <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; gap: 10px; align-items: center;">
                        <span onclick="generatePassword()" style="cursor: pointer; user-select: none; display: flex;" title="Generate Strong Password">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                        </span>
                        <span onclick="togglePassword('upload-password')" style="cursor: pointer; user-select: none;" title="Show/Hide">👁️</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div>
                        <label style="font-size: 0.8rem; margin-bottom: 0.2rem;">Expires in (Hours)</label>
                        <input type="number" id="expires-in" value="1" min="1" max="{{MAX_RETENTION_HOURS}}" oninput="validateExpiration(this)">
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; margin-bottom: 0.2rem;">Max Views (0 = Unlimited, max {{MAX_VIEWS_LIMIT}})</label>
                        <input type="number" id="max-views" placeholder="Unlimited" min="0" max="{{MAX_VIEWS_LIMIT}}" oninput="validateMaxViews(this)">
                    </div>
                </div>
            </div>

            <button id="upload-btn" onclick="upload()">Encrypt & Share</button>
            <div id="upload-progress-container" class="hidden" style="margin-top: 1rem;">
                <div style="background-color: var(--border); border-radius: 4px; overflow: hidden; height: 4px;">
                    <div id="upload-progress-bar" style="width: 0%; height: 100%; background-color: var(--success); transition: width 0.2s;"></div>
                </div>
                <p id="upload-progress-text" style="text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">0%</p>
            </div>
            <div id="upload-error" class="error"></div>
            
            <div id="share-result" class="hidden">
                <p>Share this link (Key is in the URL anchor):</p>
                <div class="result-box" id="share-link"></div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button onclick="copyLink()" class="btn-secondary">Copy Link</button>
                    <button onclick="resetUpload()" class="btn-secondary" style="border-color: var(--error); color: var(--error);">Upload Another</button>
                </div>
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
            <div id="download-progress-container" class="hidden" style="margin-top: 1rem;">
                <div style="background-color: var(--border); border-radius: 4px; overflow: hidden; height: 4px;">
                    <div id="download-progress-bar" style="width: 0%; height: 100%; background-color: var(--success); transition: width 0.2s;"></div>
                </div>
                <p id="download-progress-text" style="text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">0%</p>
            </div>
            <div id="download-error" class="error"></div>

            <div id="preview-area" class="hidden">
                <h3>Content Preview</h3>
                <div id="preview-content" class="result-box"></div>
                <button id="save-file-btn" onclick="saveFile()" style="margin-top: 1rem;">Save File</button>
            </div>
        </div>
    </div>

    <div id="toast-container"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
        // --- Config ---
        const CONFIG = {
            maxFileSize: {{MAX_FILE_SIZE}},
            maxRetentionHours: {{MAX_RETENTION_HOURS}},
            maxViewsLimit: {{MAX_VIEWS_LIMIT}}
        };

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

        function validateExpiration(input) {
            if (input.value === '') {
                return;
            }

            const value = Number(input.value);

            if (!Number.isFinite(value)) {
                input.value = 1;
                showToast("Expiration must be a valid number", "error");
                return;
            }

            if (value < 1) {
                input.value = 1;
                showToast("Expiration must be at least 1 hour", "error");
                return;
            }

            if (value > CONFIG.maxRetentionHours) {
                input.value = CONFIG.maxRetentionHours;
                showToast("Expiration time cannot exceed " + CONFIG.maxRetentionHours + " hours", "error");
                return;
            }

            input.value = Math.floor(value);
        }

        function validateMaxViews(input) {
            if (input.value === '') {
                return;
            }

            const value = Number(input.value);

            if (!Number.isFinite(value)) {
                input.value = '';
                showToast("Max views must be a valid number", "error");
                return;
            }

            if (value < 0) {
                input.value = '';
                showToast("Max views cannot be negative", "error");
                return;
            }

            if (value > CONFIG.maxViewsLimit) {
                input.value = CONFIG.maxViewsLimit;
                showToast("Max views cannot exceed " + CONFIG.maxViewsLimit, "error");
                return;
            }

            input.value = Math.floor(value);
        }

        function generatePassword() {
            const length = 16;
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
            let retVal = "";
            for (let i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            const input = document.getElementById('upload-password');
            input.value = retVal;
            input.type = "text";
            showToast("Strong password generated", "success");
        }

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
            const progressContainer = document.getElementById('upload-progress-container');
            const progressBar = document.getElementById('upload-progress-bar');
            const progressText = document.getElementById('upload-progress-text');

            btn.disabled = true;
            btn.innerText = 'Encrypting...';
            errorDiv.innerText = '';
            progressContainer.classList.add('hidden');

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
                progressContainer.classList.remove('hidden');
                progressBar.style.width = '0%';
                progressText.innerText = '0%';

                const password = document.getElementById('upload-password').value;

                const expiresInField = document.getElementById('expires-in');
                const expiresValue = Number(expiresInField.value);
                if (!Number.isFinite(expiresValue)) {
                    throw new Error("Expiration must be a valid number");
                }
                if (expiresValue <= 0) {
                    throw new Error("Expiration must be at least 1 hour");
                }
                if (expiresValue > CONFIG.maxRetentionHours) {
                    throw new Error("Expiration time cannot exceed " + CONFIG.maxRetentionHours + " hours");
                }
                const expiresIn = Math.floor(expiresValue);

                const maxViewsField = document.getElementById('max-views');
                let maxViews = -1;
                const rawMaxViews = (maxViewsField.value || '').trim();
                if (rawMaxViews !== '') {
                    const parsedMaxViews = Number(rawMaxViews);
                    if (!Number.isFinite(parsedMaxViews)) {
                        throw new Error("Max views must be a valid number");
                    }
                    if (parsedMaxViews < 0) {
                        throw new Error("Max views cannot be negative");
                    }
                    if (parsedMaxViews > CONFIG.maxViewsLimit) {
                        throw new Error("Max views cannot exceed " + CONFIG.maxViewsLimit);
                    }
                    if (parsedMaxViews === 0) {
                        maxViews = -1;
                    } else {
                        maxViews = Math.floor(parsedMaxViews);
                    }
                }

                const accessControl = {
                    password: password || null,
                    maxViews: maxViews,
                    burnAfterRead: maxViews === 1,
                    expiresIn: expiresIn
                };

                const result = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    
                    xhr.upload.addEventListener("progress", (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.round((event.loaded / event.total) * 100);
                            progressBar.style.width = percent + '%';
                            progressText.innerText = percent + '%';
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                resolve(JSON.parse(xhr.responseText));
                            } catch (e) {
                                reject(new Error("Invalid response format"));
                            }
                        } else {
                            try {
                                const err = JSON.parse(xhr.responseText);
                                reject(new Error(err.error || 'Upload failed'));
                            } catch (e) {
                                reject(new Error('Upload failed with status ' + xhr.status));
                            }
                        }
                    });

                    xhr.addEventListener("error", () => reject(new Error("Network error")));
                    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

                    xhr.open("POST", "/api/upload");
                    xhr.setRequestHeader("Content-Type", "application/octet-stream");
                    xhr.setRequestHeader("X-Encrypted-Metadata", arrayBufferToBase64(combinedMeta));
                    xhr.setRequestHeader("X-Access-Control", btoa(JSON.stringify(accessControl)));
                    xhr.setRequestHeader("X-Original-Content-Type", metadata.type === 'text' ? 'text/plain' : 'application/octet-stream');
                    
                    xhr.send(combinedData);
                });

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
                progressContainer.classList.add('hidden');
            }
        }

        function copyLink() {
            const text = document.getElementById('share-link').innerText;
            navigator.clipboard.writeText(text);
            showToast('Link copied to clipboard!', 'success');
        }

        function resetUpload() {
            if (!confirm("Warning: The current share link will be lost if you haven't saved it. Continue?")) {
                return;
            }
            
            // Reset UI
            document.getElementById('share-result').classList.add('hidden');
            document.getElementById('upload-btn').disabled = false;
            document.getElementById('upload-btn').innerText = 'Encrypt & Share';
            document.getElementById('upload-progress-container').classList.add('hidden');
            document.getElementById('upload-progress-bar').style.width = '0%';
            document.getElementById('upload-progress-text').innerText = '0%';
            
            // Reset Inputs
            document.getElementById('file-input').value = '';
            document.getElementById('text-input').value = '';
            document.getElementById('upload-password').value = '';
            document.getElementById('selected-file').innerText = '';
            document.getElementById('upload-error').innerText = '';
            
            // Reset State
            selectedFile = null;
            
            // Reset Tab to File
            switchTab('file');
        }

        async function downloadOrPreview() {
            const btn = document.getElementById('download-btn');
            const errorDiv = document.getElementById('download-error');
            const progressContainer = document.getElementById('download-progress-container');
            const progressBar = document.getElementById('download-progress-bar');
            const progressText = document.getElementById('download-progress-text');

            btn.disabled = true;
            errorDiv.innerText = '';
            progressContainer.classList.add('hidden');

            try {
                const shareId = window.location.pathname.split('/')[2];
                const keyBase64 = window.location.hash.substring(1);
                const password = document.getElementById('download-password').value;

                // 1. Fetch
                const params = new URLSearchParams();
                if (password) params.set('password', password);
                
                const res = await fetch(\`/api/share/\${shareId}?\${params}\`);
                
                // Handle errors (JSON response)
                if (!res.ok) {
                    const data = await res.json();
                    if (res.status === 401 || (data.code === 'PASSWORD_REQUIRED')) {
                        document.getElementById('password-prompt').classList.remove('hidden');
                        btn.disabled = false;
                        if (res.status === 401) throw new Error("Password required");
                    }
                    throw new Error(data.error || 'Download failed');
                }

                // Show Progress
                progressContainer.classList.remove('hidden');
                progressBar.style.width = '0%';
                progressText.innerText = '0%';

                // 2. Decrypt
                const key = await importKeyFromBase64(keyBase64);

                // Decrypt Metadata
                const encryptedMetadataBase64 = res.headers.get('X-Encrypted-Metadata');
                if (!encryptedMetadataBase64) throw new Error("Missing metadata header");

                const metaBuf = base64ToArrayBuffer(encryptedMetadataBase64);
                const { iv: metaIv, ciphertext: metaCipher } = separateIvAndCiphertext(metaBuf);
                const decMetaBuf = await decryptData(key, metaCipher, metaIv);
                const metadata = JSON.parse(new TextDecoder().decode(decMetaBuf));
                decryptedMeta = metadata;

                // Read Stream with Progress
                const contentLength = res.headers.get('Content-Length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                let loaded = 0;

                const reader = res.body.getReader();
                const chunks = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    chunks.push(value);
                    loaded += value.length;

                    if (total) {
                        const percent = Math.round((loaded / total) * 100);
                        progressBar.style.width = percent + '%';
                        progressText.innerText = percent + '%';
                    } else {
                        progressText.innerText = (loaded / 1024 / 1024).toFixed(1) + ' MB';
                    }
                }

                // Combine chunks
                const encryptedDataBuf = new Uint8Array(loaded);
                let position = 0;
                for (const chunk of chunks) {
                    encryptedDataBuf.set(chunk, position);
                    position += chunk.length;
                }

                // Decrypt Data
                const { iv: dataIv, ciphertext: dataCipher } = separateIvAndCiphertext(encryptedDataBuf.buffer);
                const decDataBuf = await decryptData(key, dataCipher, dataIv);
                
                decryptedBlob = new Blob([decDataBuf], { type: metadata.mimeType });

                // 3. Show Content
                document.getElementById('preview-area').classList.remove('hidden');
                document.getElementById('download-btn').classList.add('hidden');
                document.getElementById('password-prompt').classList.add('hidden');
                progressContainer.classList.add('hidden');

                const previewDiv = document.getElementById('preview-content');

                // Determine preview type: image, video, audio, text
                const mime = (metadata.mimeType || '').toLowerCase();

                if (mime.startsWith('image/')) {
                    const url = URL.createObjectURL(decryptedBlob);
                    previewDiv.innerHTML = \`<img src="\${url}" alt="Preview">\`;
                } else if (mime.startsWith('video/')) {
                    const url = URL.createObjectURL(decryptedBlob);
                    previewDiv.innerHTML = \`<video controls src="\${url}">Your browser does not support the video element.</video>\`;
                } else if (mime.startsWith('audio/')) {
                    const url = URL.createObjectURL(decryptedBlob);
                    previewDiv.innerHTML = \`<audio controls src="\${url}">Your browser does not support the audio element.</audio>\`;
                } else if (metadata.type === 'text' || mime.startsWith('text/')) {
                    const text = new TextDecoder().decode(decDataBuf);
                    previewDiv.innerHTML = \`<pre style="white-space: pre-wrap;">\${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>\`;
                } else {
                    previewDiv.innerText = \`File: \${metadata.filename} (\${(metadata.size/1024).toFixed(1)} KB)\\nPreview not available for this file type.\`;
                }

                if (res.headers.get('X-Is-Last-View') === 'true') {
                    showToast("This was the last view allowed. The file has been deleted from the server.", 'info');
                }

            } catch (e) {
                console.error(e);
                errorDiv.innerText = e.message;
                btn.disabled = false;
                showToast(e.message, 'error');
                progressContainer.classList.add('hidden');
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
