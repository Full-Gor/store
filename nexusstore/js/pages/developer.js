import { icons } from '../icons.js';
import { state, setState, showToast } from '../state.js';
import { renderUploadZone, initUploadZone, validateFile } from '../components/uploadZone.js';

export function renderDeveloperPage() {
  const { isAuthenticated, user, developerStats } = state;

  return `
    <div class="page-developer">
      <div class="page-header">
        <h1 class="page-title">Espace Développeur</h1>
        <p class="page-subtitle">Publiez et monétisez vos applications</p>
      </div>

      ${isAuthenticated ? renderDeveloperDashboard(user, developerStats) : renderDeveloperLanding()}
    </div>
  `;
}

function renderDeveloperDashboard(user, stats) {
  return `
    <div class="dev-dashboard">
      <!-- Welcome -->
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 20px; margin-bottom: 4px;">Bonjour, ${escapeHtml(user?.name || 'Développeur')}</h2>
        <p style="color: var(--text-muted); font-size: 14px;">Voici un aperçu de vos performances</p>
      </div>

      <!-- Stats Grid -->
      <div class="dev-stats-grid">
        <div class="dev-stat-card">
          <div class="dev-stat-icon">${icons.apps}</div>
          <div>
            <div class="dev-stat-value">${stats.apps || 0}</div>
            <div class="dev-stat-label">Applications</div>
          </div>
        </div>
        <div class="dev-stat-card">
          <div class="dev-stat-icon">${icons.download}</div>
          <div>
            <div class="dev-stat-value">${formatNumber(stats.downloads || 0)}</div>
            <div class="dev-stat-label">Téléchargements</div>
          </div>
        </div>
        <div class="dev-stat-card">
          <div class="dev-stat-icon">${icons.dollar}</div>
          <div>
            <div class="dev-stat-value">${stats.revenue || 0}€</div>
            <div class="dev-stat-label">Revenus</div>
          </div>
        </div>
        <div class="dev-stat-card">
          <div class="dev-stat-icon">${icons.star}</div>
          <div>
            <div class="dev-stat-value">${stats.rating || '--'}</div>
            <div class="dev-stat-label">Note moyenne</div>
          </div>
        </div>
      </div>

      <!-- Upload Section -->
      <section class="section" style="margin-top: 32px;">
        <h3 class="section-title" style="margin-bottom: 16px;">
          ${icons.upload}
          <span>Publier une nouvelle application</span>
        </h3>
        ${renderUploadZone()}
      </section>

      <!-- My Apps Section -->
      <section class="section" style="margin-top: 32px;">
        <div class="section-header">
          <h3 class="section-title">
            ${icons.apps}
            <span>Mes applications</span>
          </h3>
          <button class="btn-link" onclick="window.loadDeveloperApps()">
            Actualiser
          </button>
        </div>
        <div id="developerApps">
          ${renderDeveloperApps()}
        </div>
      </section>
    </div>
  `;
}

function renderDeveloperApps() {
  const myApps = state.apps.filter(app =>
    app.developer_id === state.user?.id ||
    app.developer === state.user?.name
  );

  if (myApps.length === 0) {
    return `
      <div class="empty-state" style="padding: 32px;">
        <div class="empty-icon">${icons.apps}</div>
        <p>Vous n'avez pas encore publié d'application</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
          Utilisez la zone ci-dessus pour uploader votre première app
        </p>
      </div>
    `;
  }

  return `
    <div class="apps-list">
      ${myApps.map(app => renderDeveloperAppRow(app)).join('')}
    </div>
  `;
}

function renderDeveloperAppRow(app) {
  const status = app.status || 'pending';
  const statusColors = {
    pending: '#ff9800',
    approved: '#4caf50',
    rejected: '#f44336'
  };
  const statusLabels = {
    pending: 'En attente',
    approved: 'Publié',
    rejected: 'Rejeté'
  };

  return `
    <div class="app-row" style="cursor: default;">
      <div class="app-row-icon" style="background: var(--bg-tertiary);">
        ${icons.apps}
      </div>
      <div class="app-row-info">
        <h3 class="app-row-name">${escapeHtml(app.name)}</h3>
        <div class="app-row-meta">
          <span class="type-badge-small">${(app.type || 'APK').toUpperCase()}</span>
          <span style="font-size: 11px; color: ${statusColors[status]};">${statusLabels[status]}</span>
          <span class="download-small">${app.downloads || 0} téléchargements</span>
        </div>
      </div>
      <div class="app-row-right" style="flex-direction: row; gap: 8px;">
        <button class="btn-icon" onclick="window.editApp('${app.id}')" title="Modifier">
          ${icons.edit}
        </button>
        <button class="btn-icon" onclick="window.deleteAppConfirm('${app.id}')" title="Supprimer" style="color: #f44336;">
          ${icons.trash}
        </button>
      </div>
    </div>
  `;
}

function renderDeveloperLanding() {
  return `
    <div class="dev-landing">
      <!-- Upload Zone (guest) -->
      ${renderUploadZone()}

      <div style="text-align: center; margin-top: 24px;">
        <p style="color: var(--text-muted); margin-bottom: 16px;">
          Connectez-vous pour publier vos applications
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="/login" data-link class="btn-secondary">
            ${icons.user}
            <span>Connexion</span>
          </a>
          <a href="/register" data-link class="btn-primary">
            ${icons.plus}
            <span>Créer un compte</span>
          </a>
        </div>
      </div>

      <!-- Pricing Section -->
      <section class="section" style="margin-top: 48px;">
        <h2 class="section-title" style="justify-content: center; margin-bottom: 24px;">
          Tarification
        </h2>
        ${renderPricingGrid()}
      </section>

      <!-- Features -->
      <section class="section" style="margin-top: 48px;">
        <h2 class="section-title" style="justify-content: center; margin-bottom: 24px;">
          Pourquoi NexusStore ?
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
          ${renderFeatureCard(icons.dollar, 'Commission réduite', 'Seulement 15% de commission sur les ventes, bien moins que les stores traditionnels.')}
          ${renderFeatureCard(icons.chart, 'Analytics avancés', 'Suivez vos téléchargements, revenus et avis en temps réel.')}
          ${renderFeatureCard(icons.globe, 'Multi-plateforme', 'Publiez des APK, AAB et PWA depuis une seule plateforme.')}
          ${renderFeatureCard(icons.check, 'Validation rapide', 'Vos apps sont validées sous 24h par notre équipe.')}
        </div>
      </section>
    </div>
  `;
}

function renderPricingGrid() {
  return `
    <div class="pricing-grid">
      <div class="pricing-card">
        <div class="pricing-badge">Gratuit</div>
        <div class="pricing-price">0€</div>
        <div class="pricing-period">pour toujours</div>
        <ul class="pricing-features">
          <li class="pricing-feature">${icons.check} 3 applications max</li>
          <li class="pricing-feature">${icons.check} Analytics basiques</li>
          <li class="pricing-feature">${icons.check} Support email</li>
          <li class="pricing-feature">${icons.check} 20% commission</li>
        </ul>
        <a href="/register" data-link class="btn-secondary" style="width: 100%;">Commencer</a>
      </div>

      <div class="pricing-card featured">
        <div class="pricing-badge">Pro</div>
        <div class="pricing-price">29€</div>
        <div class="pricing-period">/ mois</div>
        <ul class="pricing-features">
          <li class="pricing-feature">${icons.check} Applications illimitées</li>
          <li class="pricing-feature">${icons.check} Analytics avancés</li>
          <li class="pricing-feature">${icons.check} Support prioritaire</li>
          <li class="pricing-feature">${icons.check} 10% commission</li>
        </ul>
        <a href="/register" data-link class="btn-primary" style="width: 100%;">Choisir Pro</a>
      </div>

      <div class="pricing-card">
        <div class="pricing-badge">Enterprise</div>
        <div class="pricing-price">Sur mesure</div>
        <div class="pricing-period">&nbsp;</div>
        <ul class="pricing-features">
          <li class="pricing-feature">${icons.check} Volume illimité</li>
          <li class="pricing-feature">${icons.check} API dédiée</li>
          <li class="pricing-feature">${icons.check} Account manager</li>
          <li class="pricing-feature">${icons.check} Commission négociée</li>
        </ul>
        <button class="btn-secondary" style="width: 100%;" onclick="window.contactEnterprise()">Contacter</button>
      </div>
    </div>
  `;
}

function renderFeatureCard(icon, title, description) {
  return `
    <div style="padding: 24px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border);">
      <div style="color: var(--accent); margin-bottom: 12px;">${icon}</div>
      <h3 style="font-size: 16px; margin-bottom: 8px;">${title}</h3>
      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${description}</p>
    </div>
  `;
}

// Helper functions
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return Math.floor(num / 1000) + 'K';
  return num.toString();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global functions
window.loadDeveloperApps = function() {
  import('../api.js').then(api => {
    api.getDeveloperApps().then(data => {
      // Update state with developer apps
      showToast('Applications actualisées', 'success');
    }).catch(err => {
      console.error('Error loading apps:', err);
    });
  });
};

window.editApp = function(appId) {
  console.log('Edit app:', appId);
  // TODO: Open edit modal
};

window.deleteAppConfirm = function(appId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette application ?')) {
    import('../api.js').then(api => {
      api.deleteApp(appId).then(() => {
        showToast('Application supprimée', 'success');
        window.renderApp();
      }).catch(err => {
        showToast('Erreur lors de la suppression', 'error');
      });
    });
  }
};

window.contactEnterprise = function() {
  window.location.href = 'mailto:enterprise@nexusstore.com?subject=NexusStore Enterprise';
};

// File selected callback
window.onFileSelected = function(file) {
  if (!state.isAuthenticated) {
    showToast('Connectez-vous pour uploader une application', 'error');
    return;
  }

  console.log('File ready for upload:', file.name);
  // TODO: Open app details form modal
};

// Initialize upload zone after render
export function initDeveloperPage() {
  setTimeout(() => {
    initUploadZone();
  }, 100);
}
