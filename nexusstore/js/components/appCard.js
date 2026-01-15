import { icons } from '../icons.js';
import { state, setState, showToast } from '../state.js';
import * as api from '../api.js';

// Map of icon names to icon SVGs (for default apps)
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

// Render app icon (handles both URL and icon name)
function renderIcon(app, size = 48) {
  // If app has an icon URL, show it as image
  if (app.icon && app.icon.startsWith('http')) {
    return `<img src="${app.icon}" alt="${escapeHtml(app.name)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
  }
  // Otherwise use SVG icon
  return appIcons[app.icon] || icons.apps;
}

// Render app card (grid view)
export function renderAppCard(app) {
  const hasImageIcon = app.icon && app.icon.startsWith('http');

  return `
    <div class="app-card" onclick="window.selectApp(${app.id})">
      <div class="app-card-icon" ${hasImageIcon ? 'style="overflow: hidden;"' : ''}>
        ${renderIcon(app)}
        ${app.isHot || app.featured ? '<span class="hot-dot"></span>' : ''}
      </div>
      <h3 class="app-card-name">${escapeHtml(app.name)}</h3>
      <p class="app-card-dev">${escapeHtml(app.developer || 'Développeur')}</p>
      <div class="app-card-meta">
        <span class="type-badge">APK</span>
        <span class="rating-small">${icons.star} ${app.rating || '5.0'}</span>
      </div>
    </div>
  `;
}

// Render app row (list view)
export function renderAppRow(app) {
  const downloads = formatDownloads(app.downloads || 0);
  const hasImageIcon = app.icon && app.icon.startsWith('http');

  return `
    <div class="app-row" onclick="window.selectApp(${app.id})">
      <div class="app-row-icon" ${hasImageIcon ? 'style="overflow: hidden;"' : ''}>
        ${renderIcon(app)}
      </div>
      <div class="app-row-info">
        <h3 class="app-row-name">${escapeHtml(app.name)}</h3>
        <p class="app-row-dev">${escapeHtml(app.developer || 'Développeur')}</p>
        <div class="app-row-meta">
          <span class="rating-small">${icons.star} ${app.rating || '5.0'}</span>
          <span class="download-small">${downloads}</span>
          <span class="type-badge-small">APK</span>
        </div>
      </div>
      <div class="app-row-right">
        <div class="app-row-price">Gratuit</div>
        <button class="download-btn" onclick="event.stopPropagation(); window.downloadAppById(${app.id})">
          ${icons.download}
        </button>
      </div>
    </div>
  `;
}

// Render featured app card (larger)
export function renderFeaturedCard(app) {
  const downloads = formatDownloads(app.downloads || 0);
  const hasImageIcon = app.icon && app.icon.startsWith('http');

  return `
    <div class="app-card featured" onclick="window.selectApp(${app.id})" style="width: 200px;">
      <div class="app-card-icon" style="width: 64px; height: 64px; ${hasImageIcon ? 'overflow: hidden;' : ''}">
        ${renderIcon(app)}
        <span class="hot-dot"></span>
      </div>
      <h3 class="app-card-name" style="font-size: 15px;">${escapeHtml(app.name)}</h3>
      <p class="app-card-dev">${escapeHtml(app.developer || 'Développeur')}</p>
      <div class="app-card-meta">
        <span class="type-badge">APK</span>
        <span class="rating-small">${icons.star} ${app.rating || '5.0'}</span>
        <span class="download-small">${downloads}</span>
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
window.selectApp = function(id) {
  const app = state.apps.find(a => a.id === id || a.id === parseInt(id));
  if (app) {
    setState({ selectedApp: app });
    window.renderApp();
  }
};

window.downloadAppById = function(id) {
  const app = state.apps.find(a => a.id === id || a.id === parseInt(id));
  if (app) {
    if (app.apkUrl) {
      // Download the APK
      api.downloadApp(app);
      showToast('Téléchargement démarré', 'success');
    } else {
      showToast('Fichier non disponible', 'error');
    }
  }
};
