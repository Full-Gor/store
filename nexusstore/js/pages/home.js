import { icons } from '../icons.js';
import { state } from '../state.js';
import { renderAppCard, renderFeaturedCard } from '../components/appCard.js';

export function renderHomePage() {
  const { apps } = state;
  const hotApps = apps.filter(a => a.isHot || a.is_hot || a.featured);
  const recentApps = apps.slice(0, 12);

  // Calculate stats
  const totalApps = apps.length;
  const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
  const developers = new Set(apps.map(a => a.developer || a.developer_name)).size;

  return `
    <div class="page-home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="hero-icon">${icons.hexagon}</span>
            NexusStore
          </h1>
          <p class="hero-subtitle">
            La marketplace indépendante pour vos applications Android et PWA.
            Découvrez, téléchargez et publiez des apps en toute liberté.
          </p>
          <div class="hero-buttons">
            <a href="/store" data-link class="btn-primary">
              ${icons.apps}
              <span>Explorer le Store</span>
            </a>
            <a href="/developer" data-link class="btn-secondary">
              ${icons.upload}
              <span>Publier une app</span>
            </a>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value">${formatNumber(totalApps)}</span>
            <span class="stat-label">Applications</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${formatNumber(developers)}</span>
            <span class="stat-label">Développeurs</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${formatDownloads(totalDownloads)}</span>
            <span class="stat-label">Téléchargements</span>
          </div>
        </div>
      </section>

      <!-- Hot/Trending Apps -->
      ${hotApps.length > 0 ? `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            ${icons.fire}
            <span>Tendances</span>
          </h2>
          <a href="/store" data-link class="btn-link">Voir tout</a>
        </div>
        <div class="apps-scroll">
          ${hotApps.map(app => renderFeaturedCard(app)).join('')}
        </div>
      </section>
      ` : ''}

      <!-- App Types -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            ${icons.phone}
            <span>Applications Android</span>
          </h2>
        </div>
        <div class="apps-scroll">
          ${apps.filter(a => a.type === 'apk').slice(0, 6).map(app => renderAppCard(app)).join('')}
          ${apps.filter(a => a.type === 'apk').length === 0 ?
            '<p style="color: var(--text-muted); padding: 20px;">Aucune application APK disponible</p>' : ''}
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            ${icons.globe}
            <span>Progressive Web Apps</span>
          </h2>
        </div>
        <div class="apps-scroll">
          ${apps.filter(a => a.type === 'pwa').slice(0, 6).map(app => renderAppCard(app)).join('')}
          ${apps.filter(a => a.type === 'pwa').length === 0 ?
            '<p style="color: var(--text-muted); padding: 20px;">Aucune PWA disponible</p>' : ''}
        </div>
      </section>

      <!-- All Apps Grid -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            ${icons.apps}
            <span>Toutes les applications</span>
          </h2>
          <a href="/store" data-link class="btn-link">Voir tout</a>
        </div>
        <div class="apps-grid">
          ${recentApps.map(app => renderAppCard(app)).join('')}
        </div>
        ${apps.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">${icons.apps}</div>
            <p>Aucune application disponible pour le moment</p>
            <a href="/developer" data-link class="btn-primary" style="margin-top: 16px;">
              ${icons.plus}
              <span>Soyez le premier à publier</span>
            </a>
          </div>
        ` : ''}
      </section>

      <!-- CTA Section -->
      <section class="section" style="text-align: center; padding: 40px 20px; background: var(--bg-secondary); border-radius: var(--radius-lg); margin-top: 20px;">
        <h2 style="font-size: 24px; margin-bottom: 12px;">Vous êtes développeur ?</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto;">
          Publiez vos applications et atteignez des milliers d'utilisateurs.
          Commission réduite, paiements rapides.
        </p>
        <a href="/developer" data-link class="btn-primary">
          ${icons.upload}
          <span>Commencer à publier</span>
        </a>
      </section>
    </div>
  `;
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1000) return Math.floor(num / 1000) + 'K+';
  return num.toString();
}

// Format downloads
function formatDownloads(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return Math.floor(num / 1000) + 'K';
  return num.toString();
}
