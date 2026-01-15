import { setState, state } from './state.js';

// Route definitions
const routes = {
  '/': 'home',
  '/store': 'store',
  '/developer': 'developer',
  '/login': 'login',
  '/register': 'register',
  '/app': 'appDetail' // /app/:id handled separately
};

// Navigate to a new route
export function navigate(path) {
  // Extract base path and params
  let basePath = path;
  let params = {};

  // Handle app detail pages
  if (path.startsWith('/app/')) {
    basePath = '/app';
    params.id = path.split('/')[2];
  }

  const page = routes[basePath] || 'home';

  // Update state
  setState({
    currentPage: page,
    mobileMenuOpen: false,
    routeParams: params
  });

  // Update browser history
  history.pushState({ page, params }, '', path);

  // Render the page
  if (window.renderApp) {
    window.renderApp();
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// Initialize router
export function initRouter() {
  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    const page = event.state?.page || 'home';
    const params = event.state?.params || {};

    setState({
      currentPage: page,
      routeParams: params
    });

    if (window.renderApp) {
      window.renderApp();
    }
  });

  // Intercept link clicks
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');

    if (link) {
      event.preventDefault();
      const href = link.getAttribute('href');

      if (href) {
        navigate(href);
      }
    }
  });

  // Set initial route from URL
  const path = window.location.pathname;
  let basePath = path;
  let params = {};

  if (path.startsWith('/app/')) {
    basePath = '/app';
    params.id = path.split('/')[2];
  }

  const page = routes[basePath] || 'home';

  setState({
    currentPage: page,
    routeParams: params
  });

  // Replace initial state
  history.replaceState({ page, params }, '', path);
}

// Get current route
export function getCurrentRoute() {
  return {
    page: state.currentPage,
    params: state.routeParams || {}
  };
}

// Check if route is active
export function isActiveRoute(path) {
  const currentPath = window.location.pathname;
  return currentPath === path || currentPath.startsWith(path + '/');
}

// Make navigate function available globally
window.navigate = navigate;
