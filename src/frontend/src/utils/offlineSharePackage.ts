export interface OfflinePackageData {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBytes: Uint8Array;
}

/**
 * Export a file as a self-contained Offline Share Package (HTML file)
 */
export async function exportOfflineSharePackage(file: File): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64Data = arrayBufferToBase64(uint8Array);

  const packageHTML = generatePackageHTML({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    base64Data,
  });

  // Trigger download of the package
  const blob = new Blob([packageHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `offline-share-${file.name}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import an Offline Share Package and extract the embedded file
 */
export async function importOfflineSharePackage(packageFile: File): Promise<OfflinePackageData> {
  const text = await packageFile.text();
  
  // Extract metadata and base64 data from the HTML
  const fileNameMatch = text.match(/data-filename="([^"]+)"/);
  const fileTypeMatch = text.match(/data-filetype="([^"]+)"/);
  const fileSizeMatch = text.match(/data-filesize="([^"]+)"/);
  const base64Match = text.match(/data-filedata="([^"]+)"/);

  if (!fileNameMatch || !base64Match) {
    throw new Error('Invalid package format');
  }

  const fileName = fileNameMatch[1];
  const fileType = fileTypeMatch ? fileTypeMatch[1] : 'application/octet-stream';
  const fileSize = fileSizeMatch ? parseInt(fileSizeMatch[1], 10) : 0;
  const base64Data = base64Match[1];

  const fileBytes = base64ToArrayBuffer(base64Data);

  return {
    fileName,
    fileType,
    fileSize,
    fileBytes,
  };
}

/**
 * Generate the self-contained HTML package
 */
function generatePackageHTML(data: {
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Share Package - ${data.fileName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      color: white;
    }
    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 10px;
    }
    .file-info {
      background: #f7f7f7;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }
    .file-info p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
    .file-info strong {
      color: #333;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #999;
    }
    .success {
      display: none;
      background: #d4edda;
      color: #155724;
      padding: 12px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📦</div>
    <h1>Offline Share Package</h1>
    <p style="color: #666; margin-bottom: 20px;">A file has been shared with you</p>
    
    <div class="file-info">
      <p><strong>File Name:</strong> ${data.fileName}</p>
      <p><strong>File Type:</strong> ${data.fileType || 'Unknown'}</p>
      <p><strong>File Size:</strong> ${formatBytes(data.fileSize)}</p>
    </div>
    
    <button onclick="saveFile()">💾 Save to Device</button>
    <div class="success" id="success">✓ File saved successfully!</div>
    
    <div class="footer">
      <p>This package works offline • No internet required</p>
    </div>
  </div>

  <script>
    const fileData = {
      name: "${data.fileName}",
      type: "${data.fileType}",
      size: ${data.fileSize},
      base64: "${data.base64Data}"
    };

    function base64ToBlob(base64, type) {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: type });
    }

    async function saveFile() {
      try {
        const blob = base64ToBlob(fileData.base64, fileData.type);
        
        // Try File System Access API first (modern browsers)
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: fileData.name,
              types: [{
                description: 'File',
                accept: { [fileData.type]: [] }
              }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            showSuccess();
            return;
          } catch (err) {
            if (err.name === 'AbortError') return;
            console.log('File System Access API failed, falling back to download');
          }
        }
        
        // Fallback to traditional download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess();
      } catch (error) {
        alert('Failed to save file: ' + error.message);
      }
    }

    function showSuccess() {
      document.getElementById('success').style.display = 'block';
      setTimeout(() => {
        document.getElementById('success').style.display = 'none';
      }, 3000);
    }
  </script>

  <div style="display: none;" 
       data-filename="${data.fileName}" 
       data-filetype="${data.fileType}" 
       data-filesize="${data.fileSize}"
       data-filedata="${data.base64Data}">
  </div>
</body>
</html>`;
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
