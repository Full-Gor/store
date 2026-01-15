import { icons } from '../icons.js';
import { state, setState, showToast } from '../state.js';

// Supported file types
const ALLOWED_EXTENSIONS = ['.apk', '.aab', '.zip'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function renderUploadZone(onFileSelect) {
  return `
    <div class="upload-zone" id="uploadZone">
      <div class="upload-icon">${icons.upload}</div>
      <h3 class="upload-title">Déposez votre application</h3>
      <p class="upload-subtitle">APK, AAB ou PWA (ZIP)</p>
      <div class="upload-formats">
        <span class="format-tag">.apk</span>
        <span class="format-tag">.aab</span>
        <span class="format-tag">.zip</span>
      </div>
      <label class="btn-primary" style="cursor:pointer;">
        ${icons.upload}
        <span>Sélectionner un fichier</span>
        <input type="file" accept=".apk,.aab,.zip" hidden id="fileInput">
      </label>
      <p class="upload-hint" style="margin-top: 12px; font-size: 11px; color: var(--text-muted);">
        Taille max: 100 MB
      </p>
    </div>
  `;
}

export function renderUploadProgress(fileName, progress) {
  return `
    <div class="upload-zone active" style="border-style: solid;">
      <div class="upload-icon" style="animation: none;">${icons.upload}</div>
      <h3 class="upload-title">${escapeHtml(fileName)}</h3>
      <div class="progress-bar" style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; margin: 16px 0;">
        <div class="progress-fill" style="width: ${progress}%; height: 100%; background: var(--accent); transition: width 0.3s ease;"></div>
      </div>
      <p class="upload-subtitle">${progress}% uploadé</p>
    </div>
  `;
}

export function renderUploadSuccess(fileName) {
  return `
    <div class="upload-zone" style="border-color: var(--accent);">
      <div class="upload-icon" style="color: var(--accent);">${icons.check}</div>
      <h3 class="upload-title">Upload réussi</h3>
      <p class="upload-subtitle">${escapeHtml(fileName)}</p>
      <button class="btn-secondary" onclick="window.resetUpload()" style="margin-top: 16px;">
        ${icons.upload}
        <span>Uploader un autre fichier</span>
      </button>
    </div>
  `;
}

// Validate file
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' };
  }

  const extension = '.' + file.name.split('.').pop().toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Utilisez: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille max: ${formatSize(MAX_FILE_SIZE)}`
    };
  }

  return { valid: true };
}

// Format file size
function formatSize(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

// HTML escape helper
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize upload zone with drag & drop
export function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  if (!zone) return;

  // Drag events
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.add('active');
  });

  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('active');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('active');

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  });

  // File input change
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      handleFileSelect(file);
    });
  }
}

// Handle file selection
function handleFileSelect(file) {
  const validation = validateFile(file);

  if (!validation.valid) {
    showToast(validation.error, 'error');
    return;
  }

  // Store selected file in state
  setState({
    uploadFile: file,
    uploadProgress: 0,
    uploadStatus: 'ready'
  });

  // Trigger callback if defined
  if (window.onFileSelected) {
    window.onFileSelected(file);
  }

  console.log('File selected:', file.name, formatSize(file.size));
}

// Global reset function
window.resetUpload = function() {
  setState({
    uploadFile: null,
    uploadProgress: 0,
    uploadStatus: null
  });
  window.renderApp();
};
