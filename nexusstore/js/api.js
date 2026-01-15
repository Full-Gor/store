// API Configuration - NexusServ Backend
const API_BASE = 'https://nexuserv.duckdns.org/api';
const APPS_KEY = 'store_apps';

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

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============= AUTH API =============

export async function login(userId, password) {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password })
  });
  if (data.token) {
    localStorage.setItem('nexusstore_token', data.token);
    localStorage.setItem('nexusstore_user', JSON.stringify({ userId, role: 'admin' }));
  }
  return data;
}

export async function register(userId, password) {
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ userId, password })
  });
  if (data.token) {
    localStorage.setItem('nexusstore_token', data.token);
    localStorage.setItem('nexusstore_user', JSON.stringify({ userId, role: 'admin' }));
  }
  return data;
}

export function logout() {
  localStorage.removeItem('nexusstore_token');
  localStorage.removeItem('nexusstore_user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('nexusstore_token');
}

export function getCurrentUser() {
  const user = localStorage.getItem('nexusstore_user');
  return user ? JSON.parse(user) : null;
}

// ============= APPS API (Key-Value Store) =============

// Get all apps from the store
export async function getApps() {
  try {
    const response = await fetch(`${API_BASE}/data/${APPS_KEY}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { apps: [] };
      }
      throw new Error('Failed to fetch apps');
    }

    const data = await response.json();
    const apps = data.value ? JSON.parse(data.value) : [];
    return { apps };
  } catch (error) {
    console.error('Error fetching apps:', error);
    return { apps: [] };
  }
}

// Get single app by ID
export async function getApp(id) {
  const { apps } = await getApps();
  return apps.find(app => app.id === id || app.id === parseInt(id));
}

// Get featured/hot apps
export async function getFeaturedApps() {
  const { apps } = await getApps();
  return { apps: apps.filter(app => app.featured || app.isHot) };
}

// Save all apps (internal helper)
async function saveApps(apps) {
  const token = localStorage.getItem('nexusstore_token');
  if (!token) throw new Error('Non authentifié');

  // Check if apps key exists
  const existsResponse = await fetch(`${API_BASE}/data/${APPS_KEY}`, {
    headers: { 'Content-Type': 'application/json' }
  });

  const method = existsResponse.ok ? 'PUT' : 'POST';
  const endpoint = existsResponse.ok ? `/data/${APPS_KEY}` : '/data';

  const body = existsResponse.ok
    ? { value: JSON.stringify(apps) }
    : { key: APPS_KEY, value: JSON.stringify(apps) };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('Failed to save apps');
  }

  return response.json();
}

// Create new app
export async function createApp(appData) {
  const { apps } = await getApps();

  const newApp = {
    id: Date.now(),
    ...appData,
    downloads: 0,
    rating: 0,
    createdAt: new Date().toISOString()
  };

  apps.push(newApp);
  await saveApps(apps);

  return newApp;
}

// Update existing app
export async function updateApp(id, appData) {
  const { apps } = await getApps();
  const index = apps.findIndex(app => app.id === id || app.id === parseInt(id));

  if (index === -1) {
    throw new Error('App not found');
  }

  apps[index] = { ...apps[index], ...appData, updatedAt: new Date().toISOString() };
  await saveApps(apps);

  return apps[index];
}

// Delete app
export async function deleteApp(id) {
  const { apps } = await getApps();
  const filtered = apps.filter(app => app.id !== id && app.id !== parseInt(id));

  if (filtered.length === apps.length) {
    throw new Error('App not found');
  }

  await saveApps(filtered);
  return { success: true };
}

// Increment download count
export async function incrementDownloads(id) {
  const { apps } = await getApps();
  const index = apps.findIndex(app => app.id === id || app.id === parseInt(id));

  if (index !== -1) {
    apps[index].downloads = (apps[index].downloads || 0) + 1;
    await saveApps(apps);
  }
}

// ============= UPLOAD API =============

// Upload app icon/screenshot (image)
export async function uploadImage(file) {
  const token = localStorage.getItem('nexusstore_token');
  if (!token) throw new Error('Non authentifié');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Image upload failed');
  }

  const data = await response.json();
  return data.url || `https://nexuserv.duckdns.org${data.path}`;
}

// Upload APK file
export async function uploadFile(file, onProgress) {
  const token = localStorage.getItem('nexusstore_token');
  if (!token) throw new Error('Non authentifié');

  const formData = new FormData();
  formData.append('file', file);

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
        const data = JSON.parse(xhr.responseText);
        resolve(data.url || `https://nexuserv.duckdns.org${data.path}`);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `${API_BASE}/upload/file`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// ============= DOWNLOAD =============

export function downloadApp(app) {
  if (app.apkUrl) {
    // Increment download count (fire and forget)
    incrementDownloads(app.id).catch(console.error);

    // Trigger download
    const link = document.createElement('a');
    link.href = app.apkUrl;
    link.download = `${app.name || 'app'}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ============= CATEGORIES =============

export function getCategories() {
  return [
    { id: 'all', name: 'Tous' },
    { id: 'games', name: 'Jeux' },
    { id: 'utils', name: 'Utilitaires' },
    { id: 'social', name: 'Social' },
    { id: 'media', name: 'Média' },
    { id: 'productivity', name: 'Productivité' },
    { id: 'finance', name: 'Finance' },
    { id: 'health', name: 'Santé' },
    { id: 'education', name: 'Éducation' },
    { id: 'other', name: 'Autre' }
  ];
}

// ============= STATS =============

export async function getStats() {
  const { apps } = await getApps();

  const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
  const totalApps = apps.length;
  const developers = new Set(apps.map(app => app.developer)).size;

  return {
    apps: totalApps,
    downloads: totalDownloads,
    developers: developers || 1
  };
}
