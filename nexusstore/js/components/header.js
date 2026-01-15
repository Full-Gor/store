import { icons } from '../icons.js';
import { state, setState } from '../state.js';

export function renderHeader() {
  const { currentPage, mobileMenuOpen, isAuthenticated, user } = state;

  return `
    <header class="header">
      <div class="header-inner">
        <a href="/" data-link class="logo">
          <div class="logo-icon">${icons.hexagon}</div>
          <span class="logo-text">NexusStore</span>
        </a>

        <nav class="desktop-nav">
          <a href="/" data-link class="nav-link ${currentPage === 'home' ? 'active' : ''}">Accueil</a>
          <a href="/store" data-link class="nav-link ${currentPage === 'store' ? 'active' : ''}">Store</a>
          <a href="/developer" data-link class="nav-link ${currentPage === 'developer' ? 'active' : ''}">Développeurs</a>
        </nav>

        <div class="desktop-actions">
          ${isAuthenticated ? renderAuthenticatedActions(user) : renderGuestActions()}
        </div>

        <button class="mobile-menu-btn" onclick="window.toggleMobileMenu()">
          ${mobileMenuOpen ? icons.close : icons.menu}
        </button>
      </div>

      ${mobileMenuOpen ? renderMobileMenu() : ''}
    </header>
  `;
}

function renderGuestActions() {
  return `
    <a href="/login" data-link class="btn-ghost">
      ${icons.user}
      <span>Connexion</span>
    </a>
    <a href="/developer" data-link class="btn-primary">
      ${icons.plus}
      <span>Publier</span>
    </a>
  `;
}

function renderAuthenticatedActions(user) {
  return `
    <a href="/developer" data-link class="btn-ghost">
      ${icons.apps}
      <span>Mes apps</span>
    </a>
    <div class="user-menu">
      <button class="btn-ghost" onclick="window.toggleUserMenu()">
        ${icons.user}
        <span>${user?.name || 'Utilisateur'}</span>
        ${icons.chevronDown}
      </button>
    </div>
  `;
}

function renderMobileMenu() {
  const { currentPage, isAuthenticated, user } = state;

  return `
    <div class="mobile-menu">
      <a href="/" data-link class="mobile-nav-link ${currentPage === 'home' ? 'active' : ''}">
        ${icons.hexagon}
        <span>Accueil</span>
      </a>
      <a href="/store" data-link class="mobile-nav-link ${currentPage === 'store' ? 'active' : ''}">
        ${icons.apps}
        <span>Store</span>
      </a>
      <a href="/developer" data-link class="mobile-nav-link ${currentPage === 'developer' ? 'active' : ''}">
        ${icons.code}
        <span>Développeurs</span>
      </a>

      <div class="mobile-menu-divider"></div>

      ${isAuthenticated ? `
        <div class="mobile-nav-link" style="color: var(--text-primary);">
          ${icons.user}
          <span>${user?.name || 'Utilisateur'}</span>
        </div>
        <button class="mobile-nav-link" onclick="window.handleLogout()">
          ${icons.logout}
          <span>Déconnexion</span>
        </button>
      ` : `
        <a href="/login" data-link class="mobile-nav-link">
          ${icons.user}
          <span>Connexion</span>
        </a>
        <a href="/register" data-link class="btn-primary" style="width:100%;justify-content:center;">
          ${icons.plus}
          <span>Créer un compte</span>
        </a>
      `}
    </div>
  `;
}

// Global functions for menu interactions
window.toggleMobileMenu = function() {
  setState({ mobileMenuOpen: !state.mobileMenuOpen });
  window.renderApp();
};

window.toggleUserMenu = function() {
  // TODO: Implement dropdown user menu
  console.log('Toggle user menu');
};

window.handleLogout = function() {
  import('../api.js').then(api => {
    api.logout();
    setState({
      user: null,
      isAuthenticated: false,
      mobileMenuOpen: false
    });
    window.navigate('/');
  });
};
