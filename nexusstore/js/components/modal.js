import { icons } from '../icons.js';
import { state, setState, showToast } from '../state.js';
import * as api from '../api.js';

// Map of icon names to icon SVGs
const appIcons = {
  message: icons.message,
  camera: icons.camera,
  activity: icons.activity,
  code: icons.code,
  wallet: icons.wallet,
  music: icons.music,
  globe: icons.globe,
  phone: icons.phone
};

// Format download numbers
function formatDownloads(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return Math.floor(num / 1000) + 'K';
  return num.toString();
}

// Render app icon
function renderIcon(app) {
  if (app.icon && app.icon.startsWith('http')) {
    return `<img src="${app.icon}" alt="${escapeHtml(app.name)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
  }
  return appIcons[app.icon] || icons.apps;
}

// Get category name
function getCategoryName(categoryId) {
  const categories = {
    games: 'Jeux',
    utils: 'Utilitaires',
    social: 'Social',
    media: 'Média',
    productivity: 'Productivité',
    finance: 'Finance',
    health: 'Santé',
    education: 'Éducation',
    other: 'Autre'
  };
  return categories[categoryId] || categoryId || 'Applications';
}

export function renderModal() {
  const { selectedApp } = state;
  if (!selectedApp) return '';

  const downloads = formatDownloads(selectedApp.downloads || 0);
  const hasImageIcon = selectedApp.icon && selectedApp.icon.startsWith('http');

  return `
    <div class="modal-overlay" onclick="window.closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="window.closeModal()">
          ${icons.close}
        </button>

        <div class="modal-header">
          <div class="modal-icon" ${hasImageIcon ? 'style="overflow: hidden;"' : ''}>
            ${renderIcon(selectedApp)}
          </div>
          <div class="modal-info">
            <h2 class="modal-title">${escapeHtml(selectedApp.name)}</h2>
            <p class="modal-dev">${escapeHtml(selectedApp.developer || 'Développeur')}</p>
            <div class="modal-badges">
              <span class="type-badge">APK</span>
              <span class="rating-badge">${icons.star} ${selectedApp.rating || '5.0'}</span>
            </div>
          </div>
        </div>

        <p class="modal-desc">
          ${selectedApp.description || `Application disponible sur NexusStore. Téléchargez-la gratuitement !`}
        </p>

        <div class="modal-details">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Version</span>
            <span class="modal-detail-value">${selectedApp.version || '1.0.0'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Téléchargements</span>
            <span class="modal-detail-value">${downloads}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Catégorie</span>
            <span class="modal-detail-value">${getCategoryName(selectedApp.category)}</span>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-price">Gratuit</div>
          <button class="btn-primary-large" onclick="window.handleDownload(${selectedApp.id})">
            ${icons.download}
            <span>Télécharger</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// HTML escape helper
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global functions
window.closeModal = function() {
  setState({ selectedApp: null });
  window.renderApp();
};

window.handleDownload = function(id) {
  const app = state.selectedApp || state.apps.find(a => a.id === id || a.id === parseInt(id));
  if (!app) return;

  if (app.apkUrl) {
    api.downloadApp(app);
    showToast('Téléchargement démarré', 'success');
    window.closeModal();
  } else {
    showToast('Fichier non disponible', 'error');
  }
};

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.selectedApp) {
    window.closeModal();
  }
});
