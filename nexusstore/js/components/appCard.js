import { icons } from '../icons.js';
import { state, setState } from '../state.js';

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

// Format price
function formatPrice(price) {
  if (price === 0) return 'Gratuit';
  return price.toFixed(2) + '€';
}

// Render app card (grid view)
export function renderAppCard(app) {
  const icon = appIcons[app.icon] || icons.apps;

  return `
    <div class="app-card" onclick="window.selectApp('${app.id}')">
      <div class="app-card-icon">
        ${icon}
        ${app.isHot || app.is_hot ? '<span class="hot-dot"></span>' : ''}
      </div>
      <h3 class="app-card-name">${escapeHtml(app.name)}</h3>
      <p class="app-card-dev">${escapeHtml(app.developer || app.developer_name || 'Développeur')}</p>
      <div class="app-card-meta">
        <span class="type-badge">${(app.type || 'APK').toUpperCase()}</span>
        <span class="rating-small">${icons.star} ${app.rating || '4.5'}</span>
      </div>
    </div>
  `;
}

// Render app row (list view)
export function renderAppRow(app) {
  const icon = appIcons[app.icon] || icons.apps;
  const downloads = formatDownloads(app.downloads || 0);
  const price = formatPrice(app.price || 0);

  return `
    <div class="app-row" onclick="window.selectApp('${app.id}')">
      <div class="app-row-icon">${icon}</div>
      <div class="app-row-info">
        <h3 class="app-row-name">${escapeHtml(app.name)}</h3>
        <p class="app-row-dev">${escapeHtml(app.developer || app.developer_name || 'Développeur')}</p>
        <div class="app-row-meta">
          <span class="rating-small">${icons.star} ${app.rating || '4.5'}</span>
          <span class="download-small">${downloads}</span>
          <span class="type-badge-small">${(app.type || 'APK').toUpperCase()}</span>
        </div>
      </div>
      <div class="app-row-right">
        <div class="app-row-price">${price}</div>
        <button class="download-btn" onclick="event.stopPropagation(); window.downloadAppById('${app.id}')">
          ${icons.download}
        </button>
      </div>
    </div>
  `;
}

// Render featured app card (larger)
export function renderFeaturedCard(app) {
  const icon = appIcons[app.icon] || icons.apps;
  const downloads = formatDownloads(app.downloads || 0);

  return `
    <div class="app-card featured" onclick="window.selectApp('${app.id}')" style="width: 200px;">
      <div class="app-card-icon" style="width: 64px; height: 64px;">
        ${icon}
        <span class="hot-dot"></span>
      </div>
      <h3 class="app-card-name" style="font-size: 15px;">${escapeHtml(app.name)}</h3>
      <p class="app-card-dev">${escapeHtml(app.developer || app.developer_name || 'Développeur')}</p>
      <div class="app-card-meta">
        <span class="type-badge">${(app.type || 'APK').toUpperCase()}</span>
        <span class="rating-small">${icons.star} ${app.rating || '4.5'}</span>
        <span class="download-small">${downloads}</span>
      </div>
    </div>
  `;
}

// HTML escape helper
function escapeHtml(text) {
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
    if (app.price > 0 && !state.isAuthenticated) {
      // Redirect to login for paid apps
      window.navigate('/login');
      return;
    }

    // For now, just log - real implementation would call API
    console.log('Downloading app:', app.name);
    import('../api.js').then(api => {
      api.downloadApp(id);
    }).catch(err => {
      console.log('Download initiated for:', app.name);
    });
  }
};
