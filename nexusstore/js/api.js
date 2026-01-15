// API Configuration
const API_BASE = '/api';

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('nexusstore_token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============= AUTH API =============

export async function login(email, password) {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.token) {
    localStorage.setItem('nexusstore_token', data.token);
  }
  return data;
}

export async function register(name, email, password, role = 'developer') {
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role })
  });
  if (data.token) {
    localStorage.setItem('nexusstore_token', data.token);
  }
  return data;
}

export function logout() {
  localStorage.removeItem('nexusstore_token');
  localStorage.removeItem('nexusstore_user');
}

export async function getCurrentUser() {
  return fetchAPI('/auth/me');
}

// ============= APPS API =============

export async function getApps(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchAPI(`/apps${query ? `?${query}` : ''}`);
}

export async function getApp(idOrSlug) {
  return fetchAPI(`/apps/${idOrSlug}`);
}

export async function getFeaturedApps() {
  return fetchAPI('/apps/featured');
}

export async function getCategories() {
  return fetchAPI('/apps/categories');
}

export async function createApp(appData) {
  return fetchAPI('/apps', {
    method: 'POST',
    body: JSON.stringify(appData)
  });
}

export async function updateApp(id, appData) {
  return fetchAPI(`/apps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appData)
  });
}

export async function deleteApp(id) {
  return fetchAPI(`/apps/${id}`, {
    method: 'DELETE'
  });
}

// ============= DEVELOPER API =============

export async function getDeveloperStats() {
  return fetchAPI('/apps/developer/stats');
}

export async function getDeveloperApps() {
  return fetchAPI('/apps/developer/apps');
}

// ============= UPLOAD API =============

export async function uploadAppFile(appId, file, onProgress) {
  const token = localStorage.getItem('nexusstore_token');
  const formData = new FormData();
  formData.append('app', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `${API_BASE}/upload/app/${appId}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export async function uploadIcon(appId, file) {
  const token = localStorage.getItem('nexusstore_token');
  const formData = new FormData();
  formData.append('icon', file);

  const response = await fetch(`${API_BASE}/upload/icon/${appId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Icon upload failed');
  }

  return response.json();
}

// ============= DOWNLOAD API =============

export function getDownloadUrl(appId) {
  const token = localStorage.getItem('nexusstore_token');
  return `${API_BASE}/apps/${appId}/download${token ? `?token=${token}` : ''}`;
}

export async function downloadApp(appId) {
  const url = getDownloadUrl(appId);
  window.location.href = url;
}

// ============= PAYMENT API =============

export async function createCheckoutSession(appId) {
  return fetchAPI('/checkout', {
    method: 'POST',
    body: JSON.stringify({ appId })
  });
}

// ============= REVIEWS API =============

export async function getReviews(appId) {
  return fetchAPI(`/apps/${appId}/reviews`);
}

export async function createReview(appId, rating, comment) {
  return fetchAPI(`/apps/${appId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  });
}
