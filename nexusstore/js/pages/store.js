import { icons } from '../icons.js';
import { state, setState } from '../state.js';
import { renderAppRow } from '../components/appCard.js';
import { renderSearchBar, filterApps } from '../components/searchBar.js';

// Category filters
const categories = [
  { id: 'all', name: 'Tous' },
  { id: 'apk', name: 'APK' },
  { id: 'pwa', name: 'PWA' },
  { id: 'free', name: 'Gratuit' },
  { id: 'paid', name: 'Payant' }
];

// Sort options
const sortOptions = [
  { id: 'newest', name: 'Plus récents' },
  { id: 'popular', name: 'Populaires' },
  { id: 'rating', name: 'Mieux notés' },
  { id: 'name', name: 'A-Z' }
];

export function renderStorePage() {
  const { filteredApps, selectedCategory, searchQuery } = state;

  return `
    <div class="page-store">
      <div class="page-header">
        <h1 class="page-title">Store</h1>
        <p class="page-subtitle">Explorez toutes les applications disponibles</p>
      </div>

      ${renderSearchBar('Rechercher une application...')}

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

      <div class="store-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-size: 13px; color: var(--text-muted);">
          ${filteredApps.length} application${filteredApps.length !== 1 ? 's' : ''}
        </span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <select
            class="form-input"
            style="padding: 8px 32px 8px 12px; font-size: 13px; width: auto;"
            onchange="window.sortApps(this.value)"
          >
            ${sortOptions.map(opt => `
              <option value="${opt.id}">${opt.name}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="apps-list">
        ${filteredApps.length === 0
          ? renderEmptyState(searchQuery)
          : filteredApps.map(app => renderAppRow(app)).join('')
        }
      </div>

      ${filteredApps.length > 0 ? renderPagination() : ''}
    </div>
  `;
}

function renderEmptyState(searchQuery) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icons.search}</div>
      <p style="font-size: 16px; margin-bottom: 8px;">Aucune application trouvée</p>
      ${searchQuery
        ? `<p style="font-size: 13px;">Aucun résultat pour "${escapeHtml(searchQuery)}"</p>`
        : '<p style="font-size: 13px;">Essayez de modifier vos filtres</p>'
      }
      <button class="btn-secondary" onclick="window.resetFilters()" style="margin-top: 16px;">
        ${icons.close}
        <span>Réinitialiser les filtres</span>
      </button>
    </div>
  `;
}

function renderPagination() {
  // Simple pagination placeholder
  return `
    <div style="display: flex; justify-content: center; padding: 24px; margin-top: 16px;">
      <p style="font-size: 13px; color: var(--text-muted);">
        Affichage de toutes les applications
      </p>
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

// Sort apps
window.sortApps = function(sortBy) {
  const { filteredApps } = state;
  let sorted = [...filteredApps];

  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      break;
    case 'popular':
      sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  setState({ filteredApps: sorted });
  window.renderApp();
};

// Reset all filters
window.resetFilters = function() {
  setState({
    selectedCategory: 'all',
    searchQuery: '',
    filteredApps: state.apps
  });
  window.renderApp();
};

// Initialize filter on page load
export function initStorePage() {
  // Ensure filtered apps are set
  if (state.filteredApps.length === 0 && state.apps.length > 0) {
    filterApps();
  }
}
