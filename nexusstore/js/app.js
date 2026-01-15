import { state, setState, subscribe, restoreSession } from './state.js';
import { initRouter, navigate } from './router.js';
import { renderHeader } from './components/header.js';
import { renderModal } from './components/modal.js';
import { renderHomePage } from './pages/home.js';
import { renderStorePage, initStorePage } from './pages/store.js';
import { renderDeveloperPage, initDeveloperPage } from './pages/developer.js';
import { renderLoginPage } from './pages/login.js';
import { renderRegisterPage } from './pages/register.js';
import { icons } from './icons.js';
import * as api from './api.js';

// Default apps (shown when API is empty or unavailable)
const defaultApps = [
  {
    id: 1,
    name: 'NexusChat',
    developer: 'TechForge Labs',
    icon: 'message',
    category: 'social',
    price: 0,
    rating: 4.8,
    downloads: 125400,
    type: 'apk',
    isHot: true,
    version: '2.4.1',
    description: 'Application de messagerie instantanée sécurisée.'
  },
  {
    id: 2,
    name: 'PhotoMaster Pro',
    developer: 'Creative Studio',
    icon: 'camera',
    category: 'media',
    price: 0,
    rating: 4.6,
    downloads: 89000,
    type: 'apk',
    isHot: false,
    version: '3.1.0',
    description: 'Éditeur photo professionnel avec filtres avancés.'
  },
  {
    id: 3,
    name: 'FitTrack',
    developer: 'HealthTech',
    icon: 'activity',
    category: 'health',
    price: 0,
    rating: 4.9,
    downloads: 234000,
    type: 'apk',
    isHot: true,
    version: '1.8.5',
    description: 'Suivez vos activités sportives et votre alimentation.'
  },
  {
    id: 4,
    name: 'CodePad',
    developer: 'DevTools Inc',
    icon: 'code',
    category: 'productivity',
    price: 0,
    rating: 4.7,
    downloads: 67000,
    type: 'apk',
    isHot: false,
    version: '2.0.0',
    description: 'Éditeur de code léger avec coloration syntaxique.'
  }
];

// Load apps from API
async function loadApps() {
  try {
    const { apps } = await api.getApps();
    if (apps && apps.length > 0) {
      setState({ apps, filteredApps: apps });
    } else {
      // Use default apps if API returns empty
      setState({ apps: defaultApps, filteredApps: defaultApps });
    }
  } catch (error) {
    console.error('Error loading apps:', error);
    // Use default apps on error
    setState({ apps: defaultApps, filteredApps: defaultApps });
  }
}

// Render current page content
function renderPage() {
  const { currentPage } = state;

  switch (currentPage) {
    case 'store':
      return renderStorePage();
    case 'developer':
      return renderDeveloperPage();
    case 'login':
      return renderLoginPage();
    case 'register':
      return renderRegisterPage();
    case 'home':
    default:
      return renderHomePage();
  }
}

// Render toast notifications
function renderToast() {
  const { toast } = state;
  if (!toast) return '';

  const iconMap = {
    success: icons.check,
    error: icons.close,
    warning: icons.warning,
    info: icons.info
  };

  return `
    <div class="toast-container">
      <div class="toast toast-${toast.type}">
        <span style="color: ${toast.type === 'success' ? '#4caf50' : toast.type === 'error' ? '#f44336' : 'var(--accent)'};">
          ${iconMap[toast.type] || icons.info}
        </span>
        <span>${toast.message}</span>
      </div>
    </div>
  `;
}

// Render loading overlay
function renderLoading() {
  const { isLoading } = state;
  if (!isLoading) return '';

  return `
    <div class="loading-overlay">
      <div class="spinner" style="width: 40px; height: 40px;"></div>
    </div>
  `;
}

// Main render function
window.renderApp = function() {
  const app = document.getElementById('app');

  if (!app) return;

  app.innerHTML = `
    ${renderHeader()}
    <main class="main">
      ${renderPage()}
    </main>
    ${renderModal()}
    ${renderToast()}
    ${renderLoading()}
  `;

  // Initialize page-specific functionality
  const { currentPage } = state;
  if (currentPage === 'store') {
    initStorePage();
  } else if (currentPage === 'developer') {
    initDeveloperPage();
  }
};

// Export for external use
export { renderPage, loadApps };

// Application startup
async function init() {
  try {
    // Restore user session
    restoreSession();

    // Initialize with default apps first (fast render)
    setState({ apps: defaultApps, filteredApps: defaultApps });

    // Initialize router
    initRouter();

    // Initial render
    window.renderApp();

    // Load apps from API in background
    loadApps().then(() => {
      window.renderApp();
    });

    console.log('NexusStore initialized');
  } catch (error) {
    console.error('Error initializing app:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 40px; text-align: center; color: #fff;">
        <h1 style="color: #c8ff00; margin-bottom: 16px;">Erreur</h1>
        <p>Une erreur s'est produite lors du chargement.</p>
        <p style="margin-top: 8px; color: #888;">${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 16px; padding: 10px 20px; background: #c8ff00; color: #0a0a0a; border: none; border-radius: 8px; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
  }
}

// Handle both cases: DOM already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
