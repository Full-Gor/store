import { icons } from '../icons.js';
import { state, setState, setUser, showToast } from '../state.js';
import * as api from '../api.js';

export function renderLoginPage() {
  return `
    <div class="page-auth">
      <div class="auth-card">
        <div class="auth-header">
          <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <div class="logo-icon" style="width: 48px; height: 48px;">
              ${icons.hexagon}
            </div>
          </div>
          <h1 class="auth-title">Connexion</h1>
          <p class="auth-subtitle">Accédez à votre compte NexusStore</p>
        </div>

        <form id="loginForm" onsubmit="window.handleLogin(event)">
          <div class="form-group">
            <label class="form-label" for="email">
              ${icons.email} Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              placeholder="votre@email.com"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="password">
              ${icons.lock} Mot de passe
            </label>
            <div style="position: relative;">
              <input
                type="password"
                id="password"
                name="password"
                class="form-input"
                placeholder="Votre mot de passe"
                required
                autocomplete="current-password"
                style="padding-right: 44px;"
              >
              <button
                type="button"
                onclick="window.togglePasswordVisibility('password')"
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px;"
              >
                ${icons.eye}
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" name="remember" style="accent-color: var(--accent);">
              Se souvenir de moi
            </label>
            <a href="#" style="font-size: 13px; color: var(--accent);">Mot de passe oublié ?</a>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;" id="loginBtn">
            ${icons.arrowRight}
            <span>Se connecter</span>
          </button>
        </form>

        <div class="auth-divider">ou</div>

        <button class="btn-secondary" style="width: 100%; justify-content: center;" onclick="window.handleDemoLogin()">
          ${icons.user}
          <span>Connexion démo</span>
        </button>

        <div class="auth-footer">
          Pas encore de compte ?
          <a href="/register" data-link>Créer un compte</a>
        </div>
      </div>
    </div>
  `;
}

// Handle login form submission
window.handleLogin = async function(event) {
  event.preventDefault();

  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const loginBtn = document.getElementById('loginBtn');

  if (!email || !password) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner"></span><span>Connexion...</span>';

  try {
    const data = await api.login(email, password);

    if (data.user) {
      setUser(data.user);
      showToast('Connexion réussie', 'success');
      window.navigate('/developer');
    }
  } catch (error) {
    showToast(error.message || 'Erreur de connexion', 'error');
    loginBtn.disabled = false;
    loginBtn.innerHTML = `${icons.arrowRight}<span>Se connecter</span>`;
  }
};

// Demo login for testing
window.handleDemoLogin = function() {
  // Simulate login with mock user
  const demoUser = {
    id: 'demo-user-1',
    name: 'Utilisateur Démo',
    email: 'demo@nexusstore.com',
    role: 'developer'
  };

  localStorage.setItem('nexusstore_token', 'demo-token-' + Date.now());
  setUser(demoUser);
  showToast('Connexion démo réussie', 'success');
  window.navigate('/developer');
};

// Toggle password visibility
window.togglePasswordVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;

  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = icons.eyeOff;
  } else {
    input.type = 'password';
    button.innerHTML = icons.eye;
  }
};
