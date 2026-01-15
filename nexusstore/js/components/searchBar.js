import { icons } from '../icons.js';
import { state, setState } from '../state.js';

export function renderSearchBar(placeholder = 'Rechercher une app...') {
  const { searchQuery } = state;

  return `
    <div class="search-wrapper">
      <div class="search-box">
        <span class="search-icon">${icons.search}</span>
        <input
          type="text"
          class="search-input"
          placeholder="${placeholder}"
          value="${escapeHtml(searchQuery)}"
          oninput="window.handleSearch(this.value)"
          onkeydown="window.handleSearchKeydown(event)"
        >
        ${searchQuery ? `
          <button class="btn-icon" style="width: 28px; height: 28px; border: none;" onclick="window.clearSearch()">
            ${icons.close}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderSearchWithFilters(categories = []) {
  const { searchQuery, selectedCategory } = state;

  return `
    <div class="search-filters">
      ${renderSearchBar()}

      <div class="categories-wrapper">
        <div class="categories-scroll">
          ${categories.map(cat => `
            <button
              class="category-chip ${selectedCategory === cat.id ? 'active' : ''}"
              onclick="window.filterCategory('${cat.id}')"
            >
              ${cat.name}
            </button>
          `).join('')}
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

// Debounce helper
let searchTimeout;
function debounce(func, wait) {
  return function(...args) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Filter apps based on search and category
function filterApps() {
  const { apps, selectedCategory, searchQuery } = state;

  let filtered = [...apps];

  // Filter by category/type
  switch (selectedCategory) {
    case 'apk':
      filtered = filtered.filter(a => a.type === 'apk');
      break;
    case 'pwa':
      filtered = filtered.filter(a => a.type === 'pwa');
      break;
    case 'free':
      filtered = filtered.filter(a => a.price === 0);
      break;
    case 'paid':
      filtered = filtered.filter(a => a.price > 0);
      break;
    // 'all' - no filter
  }

  // Filter by search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.developer && a.developer.toLowerCase().includes(q)) ||
      (a.developer_name && a.developer_name.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  }

  setState({ filteredApps: filtered });
}

// Global search handler with debounce
window.handleSearch = debounce(function(query) {
  setState({ searchQuery: query });
  filterApps();
  window.renderApp();
}, 300);

// Handle search on Enter key
window.handleSearchKeydown = function(event) {
  if (event.key === 'Enter') {
    clearTimeout(searchTimeout);
    const query = event.target.value;
    setState({ searchQuery: query });
    filterApps();
    window.renderApp();
  }
};

// Clear search
window.clearSearch = function() {
  setState({ searchQuery: '' });
  filterApps();
  window.renderApp();
};

// Filter by category
window.filterCategory = function(category) {
  setState({ selectedCategory: category });
  filterApps();
  window.renderApp();
};

// Export filter function for external use
export { filterApps };
