import { icons } from '../icons.js';
import { state, setState, showToast } from '../state.js';
import * as api from '../api.js';

export function renderDeveloperPage() {
  const { isAuthenticated, user } = state;

  return `
    <div class="page-developer">
      <div class="page-header">
        <h1 class="page-title">Espace Admin</h1>
        <p class="page-subtitle">Gérez les applications du store</p>
      </div>

      ${isAuthenticated ? renderAdminDashboard(user) : renderLoginPrompt()}
    </div>
  `;
}

function renderAdminDashboard(user) {
  const { apps } = state;
  const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);

  return `
    <div class="dev-dashboard">
      <!-- Welcome -->
      <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 20px; margin-bottom: 4px;">Bonjour, ${escapeHtml(user?.name || user?.userId || 'Admin')}</h2>
          <p style="color: var(--text-muted); font-size: 14px;">Gérez votre marketplace</p>
        </div>
        <button class="btn-secondary" onclick="window.handleLogout()">
          ${icons.logout}
          <span>Déconnexion</span>
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="dev-stats-grid">
        <div class="dev-stat-card">
          <div class="dev-stat-icon">${icons.apps}</div>
          <div>
            <div class="dev-stat-value">${apps.length}</div>
            <div class="dev-stat-label">Applications</div>
          </div>
        </div>
        <div class="dev-stat-card">
          <div class="dev-stat-icon">${icons.download}</div>
          <div>
            <div class="dev-stat-value">${formatNumber(totalDownloads)}</div>
            <div class="dev-stat-label">Téléchargements</div>
          </div>
        </div>
      </div>

      <!-- Add New App -->
      <section class="section" style="margin-top: 32px;">
        <h3 class="section-title" style="margin-bottom: 16px;">
          ${icons.plus}
          <span>Ajouter une application</span>
        </h3>
        ${renderAddAppForm()}
      </section>

      <!-- Apps List -->
      <section class="section" style="margin-top: 32px;">
        <div class="section-header">
          <h3 class="section-title">
            ${icons.apps}
            <span>Applications (${apps.length})</span>
          </h3>
          <button class="btn-link" onclick="window.refreshApps()">
            Actualiser
          </button>
        </div>
        <div id="appsListContainer">
          ${renderAppsList(apps)}
        </div>
      </section>
    </div>
  `;
}

function renderAddAppForm() {
  const categories = api.getCategories().filter(c => c.id !== 'all');

  return `
    <div class="auth-card" style="max-width: 100%;">
      <form id="addAppForm" onsubmit="window.handleAddApp(event)">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label class="form-label">Nom de l'app *</label>
            <input type="text" name="name" class="form-input" placeholder="Mon Application" required>
          </div>

          <div class="form-group">
            <label class="form-label">Développeur</label>
            <input type="text" name="developer" class="form-input" placeholder="Nom du développeur">
          </div>

          <div class="form-group">
            <label class="form-label">Version</label>
            <input type="text" name="version" class="form-input" placeholder="1.0.0" value="1.0.0">
          </div>

          <div class="form-group">
            <label class="form-label">Catégorie</label>
            <select name="category" class="form-input form-select">
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">Description</label>
          <textarea name="description" class="form-input" rows="3" placeholder="Description de l'application..."></textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
          <div class="form-group">
            <label class="form-label">Icône (image)</label>
            <input type="file" id="iconFile" accept="image/*" class="form-input" style="padding: 8px;">
            <small style="color: var(--text-muted);">PNG, JPG, WebP</small>
          </div>

          <div class="form-group">
            <label class="form-label">Fichier APK *</label>
            <input type="file" id="apkFile" accept=".apk" class="form-input" style="padding: 8px;" required>
            <small style="color: var(--text-muted);">Fichier .apk uniquement</small>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px; margin-top: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" name="featured" style="accent-color: var(--accent);">
            <span style="font-size: 14px;">Mettre en avant</span>
          </label>
        </div>

        <div id="uploadProgress" style="display: none; margin-top: 16px;">
          <div style="background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
            <div id="progressBar" style="height: 8px; background: var(--accent); width: 0%; transition: width 0.3s;"></div>
          </div>
          <p id="progressText" style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Upload en cours...</p>
        </div>

        <button type="submit" id="submitBtn" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 24px;">
          ${icons.upload}
          <span>Publier l'application</span>
        </button>
      </form>
    </div>
  `;
}

function renderAppsList(apps) {
  if (!apps || apps.length === 0) {
    return `
      <div class="empty-state" style="padding: 32px;">
        <div class="empty-icon">${icons.apps}</div>
        <p>Aucune application dans le store</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
          Utilisez le formulaire ci-dessus pour ajouter votre première app
        </p>
      </div>
    `;
  }

  return `
    <div class="apps-list">
      ${apps.map(app => renderAppRow(app)).join('')}
    </div>
  `;
}

function renderAppRow(app) {
  return `
    <div class="app-row" style="cursor: default;">
      <div class="app-row-icon" style="background: var(--bg-tertiary); overflow: hidden;">
        ${app.icon ? `<img src="${app.icon}" alt="" style="width: 100%; height: 100%; object-fit: cover;">` : icons.apps}
      </div>
      <div class="app-row-info">
        <h3 class="app-row-name">${escapeHtml(app.name)}</h3>
        <div class="app-row-meta">
          <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(app.developer || 'Inconnu')}</span>
          <span class="type-badge-small">APK</span>
          <span class="download-small">${app.downloads || 0} DL</span>
        </div>
      </div>
      <div class="app-row-right" style="flex-direction: row; gap: 8px;">
        <button class="btn-icon" onclick="window.deleteAppConfirm(${app.id})" title="Supprimer" style="color: #f44336;">
          ${icons.trash}
        </button>
      </div>
    </div>
  `;
}

function renderLoginPrompt() {
  return `
    <div class="dev-landing" style="text-align: center; padding: 48px 20px;">
      <div style="max-width: 400px; margin: 0 auto;">
        <div style="color: var(--accent); margin-bottom: 24px;">
          ${icons.lock}
        </div>
        <h2 style="font-size: 24px; margin-bottom: 12px;">Accès restreint</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">
          Connectez-vous pour accéder à l'espace d'administration
        </p>
        <a href="/login" data-link class="btn-primary" style="display: inline-flex;">
          ${icons.user}
          <span>Se connecter</span>
        </a>
      </div>
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
window.handleAddApp = async function(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = document.getElementById('submitBtn');
  const progressDiv = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  const iconFile = document.getElementById('iconFile').files[0];
  const apkFile = document.getElementById('apkFile').files[0];

  if (!apkFile) {
    showToast('Veuillez sélectionner un fichier APK', 'error');
    return;
  }

  // Show progress
  submitBtn.disabled = true;
  progressDiv.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = 'Préparation...';

  try {
    let iconUrl = '';
    let apkUrl = '';

    // Upload icon if provided
    if (iconFile) {
      progressText.textContent = 'Upload de l\'icône...';
      progressBar.style.width = '20%';
      iconUrl = await api.uploadImage(iconFile);
    }

    // Upload APK
    progressText.textContent = 'Upload de l\'APK...';
    apkUrl = await api.uploadFile(apkFile, (percent) => {
      progressBar.style.width = `${20 + percent * 0.7}%`;
      progressText.textContent = `Upload de l'APK... ${percent}%`;
    });

    // Create app entry
    progressText.textContent = 'Enregistrement...';
    progressBar.style.width = '95%';

    const appData = {
      name: form.name.value.trim(),
      developer: form.developer.value.trim() || 'NexusStore',
      version: form.version.value.trim() || '1.0.0',
      category: form.category.value,
      description: form.description.value.trim(),
      icon: iconUrl,
      apkUrl: apkUrl,
      type: 'apk',
      isHot: form.featured.checked,
      featured: form.featured.checked
    };

    await api.createApp(appData);

    progressBar.style.width = '100%';
    progressText.textContent = 'Terminé !';

    showToast('Application publiée avec succès', 'success');

    // Reset form and refresh
    form.reset();
    progressDiv.style.display = 'none';

    // Reload apps
    const { apps } = await api.getApps();
    setState({ apps, filteredApps: apps });
    window.renderApp();

  } catch (error) {
    console.error('Error adding app:', error);
    showToast(error.message || 'Erreur lors de la publication', 'error');
    progressDiv.style.display = 'none';
  } finally {
    submitBtn.disabled = false;
  }
};

window.deleteAppConfirm = async function(appId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette application ?')) {
    try {
      await api.deleteApp(appId);
      showToast('Application supprimée', 'success');

      // Reload apps
      const { apps } = await api.getApps();
      setState({ apps, filteredApps: apps });
      window.renderApp();
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  }
};

window.refreshApps = async function() {
  try {
    const { apps } = await api.getApps();
    setState({ apps, filteredApps: apps });
    showToast('Liste actualisée', 'success');
    window.renderApp();
  } catch (error) {
    showToast('Erreur lors de l\'actualisation', 'error');
  }
};

window.handleLogout = function() {
  api.logout();
  setState({ user: null, isAuthenticated: false });
  showToast('Déconnexion réussie', 'success');
  window.navigate('/');
};

// Initialize
export function initDeveloperPage() {
  // Nothing special needed
}
