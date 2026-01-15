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

// Mock data for development
const mockApps = [
  {
    id: 1,
    name: 'NexusChat',
    developer: 'TechForge Labs',
    icon: 'message',
    category: 'Communication',
    price: 0,
    rating: 4.8,
    downloads: 125400,
    type: 'apk',
    isHot: true,
    version: '2.4.1',
    size: 25165824,
    description: 'Application de messagerie instantanée sécurisée avec chiffrement de bout en bout.'
  },
  {
    id: 2,
    name: 'PhotoMaster Pro',
    developer: 'Creative Studio',
    icon: 'camera',
    category: 'Photo & Vidéo',
    price: 4.99,
    rating: 4.6,
    downloads: 89000,
    type: 'apk',
    isHot: false,
    version: '3.1.0',
    size: 52428800,
    description: 'Éditeur photo professionnel avec filtres avancés et outils de retouche.'
  },
  {
    id: 3,
    name: 'FitTrack',
    developer: 'HealthTech',
    icon: 'activity',
    category: 'Santé & Fitness',
    price: 2.99,
    rating: 4.9,
    downloads: 234000,
    type: 'pwa',
    isHot: true,
    version: '1.8.5',
    size: 8388608,
    description: 'Suivez vos activités sportives, votre alimentation et votre sommeil.'
  },
  {
    id: 4,
    name: 'CodePad',
    developer: 'DevTools Inc',
    icon: 'code',
    category: 'Productivité',
    price: 0,
    rating: 4.7,
    downloads: 67000,
    type: 'pwa',
    isHot: false,
    version: '2.0.0',
    size: 4194304,
    description: 'Éditeur de code léger avec coloration syntaxique et support multi-langage.'
  },
  {
    id: 5,
    name: 'BudgetWise',
    developer: 'FinApp Studio',
    icon: 'wallet',
    category: 'Finance',
    price: 1.99,
    rating: 4.5,
    downloads: 156000,
    type: 'apk',
    isHot: true,
    version: '4.2.0',
    size: 31457280,
    description: 'Gérez vos finances personnelles et suivez vos dépenses facilement.'
  },
  {
    id: 6,
    name: 'MusicFlow',
    developer: 'SoundWave',
    icon: 'music',
    category: 'Musique',
    price: 0,
    rating: 4.4,
    downloads: 98000,
    type: 'apk',
    isHot: false,
    version: '5.0.2',
    size: 41943040,
    description: 'Lecteur de musique élégant avec égaliseur et support des playlists.'
  },
  {
    id: 7,
    name: 'WorldExplorer',
    developer: 'TravelApps',
    icon: 'globe',
    category: 'Voyage',
    price: 0,
    rating: 4.3,
    downloads: 45000,
    type: 'pwa',
    isHot: false,
    version: '1.5.0',
    size: 6291456,
    description: 'Découvrez des destinations de voyage et planifiez vos aventures.'
  },
  {
    id: 8,
    name: 'SecureVault',
    developer: 'CyberSafe',
    icon: 'phone',
    category: 'Utilitaires',
    price: 3.99,
    rating: 4.8,
    downloads: 78000,
    type: 'apk',
    isHot: true,
    version: '2.1.0',
    size: 15728640,
    description: 'Gestionnaire de mots de passe sécurisé avec synchronisation cloud.'
  }
];

// Initialize state with mock data
setState({
  apps: mockApps,
  filteredApps: mockApps
});

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
export { renderPage };

// Application startup
document.addEventListener('DOMContentLoaded', () => {
  // Restore user session
  restoreSession();

  // Initialize router
  initRouter();

  // Initial render
  window.renderApp();

  // Log startup
  console.log('NexusStore initialized');
});
