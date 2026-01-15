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

// Format file size
function formatSize(bytes) {
  if (!bytes) return 'N/A';
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

// Format price
function formatPrice(price) {
  if (price === 0) return 'Gratuit';
  return price.toFixed(2) + '€';
}

export function renderModal() {
  const { selectedApp } = state;
  if (!selectedApp) return '';

  const icon = appIcons[selectedApp.icon] || icons.apps;
  const downloads = formatDownloads(selectedApp.downloads || 0);
  const price = formatPrice(selectedApp.price || 0);
  const size = formatSize(selectedApp.size);

  return `
    <div class="modal-overlay" onclick="window.closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="window.closeModal()">
          ${icons.close}
        </button>

        <div class="modal-header">
          <div class="modal-icon">${icon}</div>
          <div class="modal-info">
            <h2 class="modal-title">${escapeHtml(selectedApp.name)}</h2>
            <p class="modal-dev">${escapeHtml(selectedApp.developer || selectedApp.developer_name || 'Développeur')}</p>
            <div class="modal-badges">
              <span class="type-badge">${(selectedApp.type || 'APK').toUpperCase()}</span>
              <span class="rating-badge">${icons.star} ${selectedApp.rating || '4.5'}</span>
            </div>
          </div>
        </div>

        <p class="modal-desc">
          ${selectedApp.description || selectedApp.short_description || `Application de qualité professionnelle. Rejoignez ${downloads} utilisateurs satisfaits.`}
        </p>

        <div class="modal-details">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Version</span>
            <span class="modal-detail-value">${selectedApp.version || '1.0.0'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Taille</span>
            <span class="modal-detail-value">${size}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Catégorie</span>
            <span class="modal-detail-value">${escapeHtml(selectedApp.category || 'Apps')}</span>
          </div>
        </div>

        ${selectedApp.package_name ? `
        <div class="modal-details" style="grid-template-columns: 1fr; margin-bottom: 16px;">
          <div class="modal-detail-item" style="text-align: left;">
            <span class="modal-detail-label">Package</span>
            <span class="modal-detail-value" style="font-family: monospace; font-size: 12px;">${escapeHtml(selectedApp.package_name)}</span>
          </div>
        </div>
        ` : ''}

        <div class="modal-stats" style="display: flex; justify-content: center; gap: 24px; margin-bottom: 24px; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: var(--accent);">${downloads}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Téléchargements</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700;">${selectedApp.rating || '4.5'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Note moyenne</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700;">${selectedApp.rating_count || '0'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Avis</div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-price">${price}</div>
          <button class="btn-primary-large" onclick="window.handleDownload('${selectedApp.id}')">
            ${icons.download}
            <span>${selectedApp.price > 0 ? 'Acheter' : 'Télécharger'}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Confirmation modal
export function renderConfirmModal(title, message, onConfirm, onCancel) {
  return `
    <div class="modal-overlay" onclick="window.closeConfirmModal()">
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px;">
        <h2 class="modal-title" style="margin-bottom: 12px;">${escapeHtml(title)}</h2>
        <p class="modal-desc">${escapeHtml(message)}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
          <button class="btn-secondary" onclick="window.closeConfirmModal()">Annuler</button>
          <button class="btn-primary" onclick="window.confirmAction()">Confirmer</button>
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
  const app = state.selectedApp;
  if (!app) return;

  if (app.price > 0) {
    if (!state.isAuthenticated) {
      window.closeModal();
      window.navigate('/login');
      return;
    }
    // Handle paid app purchase
    import('../api.js').then(api => {
      api.createCheckoutSession(id).then(session => {
        if (session.url) {
          window.location.href = session.url;
        }
      }).catch(err => {
        console.error('Checkout error:', err);
        import('../state.js').then(({ showToast }) => {
          showToast('Erreur lors du paiement', 'error');
        });
      });
    });
  } else {
    // Free app download
    window.downloadAppById(id);
    window.closeModal();
  }
};

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.selectedApp) {
    window.closeModal();
  }
});
