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
          <h1 class="auth-title">Administration</h1>
          <p class="auth-subtitle">Connectez-vous pour gérer le store</p>
        </div>

        <form id="loginForm" onsubmit="window.handleLogin(event)">
          <div class="form-group">
            <label class="form-label" for="userId">
              ${icons.user} Identifiant
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              class="form-input"
              placeholder="Votre identifiant"
              required
              autocomplete="username"
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

          <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 24px;" id="loginBtn">
            ${icons.arrowRight}
            <span>Se connecter</span>
          </button>
        </form>

        <div class="auth-footer" style="margin-top: 24px;">
          <a href="/" data-link style="color: var(--text-muted);">Retour au store</a>
        </div>
      </div>
    </div>
  `;
}

// Handle login form submission
window.handleLogin = async function(event) {
  event.preventDefault();

  const form = event.target;
  const userId = form.userId.value.trim();
  const password = form.password.value;
  const loginBtn = document.getElementById('loginBtn');

  if (!userId || !password) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner"></span><span>Connexion...</span>';

  try {
    const data = await api.login(userId, password);

    if (data.token) {
      setUser({ userId, role: 'admin', name: userId });
      showToast('Connexion réussie', 'success');
      window.navigate('/developer');
    }
  } catch (error) {
    showToast(error.message || 'Erreur de connexion', 'error');
    loginBtn.disabled = false;
    loginBtn.innerHTML = `${icons.arrowRight}<span>Se connecter</span>`;
  }
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
