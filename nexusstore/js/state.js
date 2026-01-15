// Global application state
export const state = {
  currentPage: 'home',
  user: null,
  isAuthenticated: false,
  apps: [],
  filteredApps: [],
  selectedCategory: 'all',
  searchQuery: '',
  selectedApp: null,
  mobileMenuOpen: false,
  isLoading: false,
  error: null,
  toast: null,
  developerStats: {
    apps: 0,
    downloads: 0,
    revenue: 0,
    rating: '--'
  }
};

// Listeners for state changes
const listeners = new Set();

// Subscribe to state changes
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Update state and notify listeners
export function setState(newState) {
  Object.assign(state, newState);
  listeners.forEach(listener => {
    try {
      listener(state);
    } catch (error) {
      console.error('State listener error:', error);
    }
  });
}

// Get current state (immutable copy)
export function getState() {
  return { ...state };
}

// Reset state to initial values
export function resetState() {
  setState({
    currentPage: 'home',
    user: null,
    isAuthenticated: false,
    apps: [],
    filteredApps: [],
    selectedCategory: 'all',
    searchQuery: '',
    selectedApp: null,
    mobileMenuOpen: false,
    isLoading: false,
    error: null
  });
}

// Show toast notification
export function showToast(message, type = 'info', duration = 3000) {
  setState({ toast: { message, type } });
  setTimeout(() => {
    setState({ toast: null });
  }, duration);
}

// Set loading state
export function setLoading(isLoading) {
  setState({ isLoading });
}

// Set error state
export function setError(error) {
  setState({ error });
  if (error) {
    showToast(error, 'error');
  }
}

// User session management
export function setUser(user) {
  setState({
    user,
    isAuthenticated: !!user
  });
  if (user) {
    localStorage.setItem('nexusstore_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('nexusstore_user');
    localStorage.removeItem('nexusstore_token');
  }
}

// Restore user session from localStorage
export function restoreSession() {
  try {
    const savedUser = localStorage.getItem('nexusstore_user');
    const token = localStorage.getItem('nexusstore_token');
    if (savedUser && token) {
      setState({
        user: JSON.parse(savedUser),
        isAuthenticated: true
      });
      return true;
    }
  } catch (error) {
    console.error('Error restoring session:', error);
  }
  return false;
}
