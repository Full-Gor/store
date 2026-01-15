import { icons } from '../icons.js';
import { state, setState, setUser, showToast } from '../state.js';
import * as api from '../api.js';

export function renderRegisterPage() {
  return `
    <div class="page-auth">
      <div class="auth-card">
        <div class="auth-header">
          <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <div class="logo-icon" style="width: 48px; height: 48px;">
              ${icons.hexagon}
            </div>
          </div>
          <h1 class="auth-title">Créer un compte</h1>
          <p class="auth-subtitle">Rejoignez la communauté NexusStore</p>
        </div>

        <form id="registerForm" onsubmit="window.handleRegister(event)">
          <div class="form-group">
            <label class="form-label" for="name">
              ${icons.user} Nom complet
            </label>
            <input
              type="text"
              id="name"
              name="name"
              class="form-input"
              placeholder="John Doe"
              required
              autocomplete="name"
              minlength="2"
            >
          </div>

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
                placeholder="Minimum 8 caractères"
                required
                autocomplete="new-password"
                minlength="8"
                style="padding-right: 44px;"
                oninput="window.checkPasswordStrength(this.value)"
              >
              <button
                type="button"
                onclick="window.togglePasswordVisibility('password')"
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px;"
              >
                ${icons.eye}
              </button>
            </div>
            <div id="passwordStrength" style="margin-top: 8px; display: none;">
              <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
              </div>
              <span id="strengthText" style="font-size: 11px; color: var(--text-muted);"></span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">
              ${icons.lock} Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              class="form-input"
              placeholder="Répétez votre mot de passe"
              required
              autocomplete="new-password"
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="role">
              ${icons.user} Type de compte
            </label>
            <select id="role" name="role" class="form-input form-select">
              <option value="developer">Développeur (publier des apps)</option>
              <option value="user">Utilisateur (télécharger uniquement)</option>
            </select>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" name="terms" required style="accent-color: var(--accent); margin-top: 2px;">
              <span>
                J'accepte les <a href="#" style="color: var(--accent);">conditions d'utilisation</a>
                et la <a href="#" style="color: var(--accent);">politique de confidentialité</a>
              </span>
            </label>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;" id="registerBtn">
            ${icons.plus}
            <span>Créer mon compte</span>
          </button>
        </form>

        <div class="auth-footer">
          Déjà un compte ?
          <a href="/login" data-link>Se connecter</a>
        </div>
      </div>
    </div>
  `;
}

// Handle registration form submission
window.handleRegister = async function(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const role = form.role.value;
  const registerBtn = document.getElementById('registerBtn');

  // Validation
  if (!name || !email || !password) {
    showToast('Veuillez remplir tous les champs', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Les mots de passe ne correspondent pas', 'error');
    return;
  }

  if (password.length < 8) {
    showToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
    return;
  }

  // Show loading state
  registerBtn.disabled = true;
  registerBtn.innerHTML = '<span class="spinner"></span><span>Création...</span>';

  try {
    const data = await api.register(name, email, password, role);

    if (data.user) {
      setUser(data.user);
      showToast('Compte créé avec succès', 'success');
      window.navigate('/developer');
    }
  } catch (error) {
    showToast(error.message || 'Erreur lors de l\'inscription', 'error');
    registerBtn.disabled = false;
    registerBtn.innerHTML = `${icons.plus}<span>Créer mon compte</span>`;
  }
};

// Check password strength
window.checkPasswordStrength = function(password) {
  const strengthDiv = document.getElementById('passwordStrength');
  const bars = strengthDiv.querySelectorAll('.strength-bar');
  const strengthText = document.getElementById('strengthText');

  strengthDiv.style.display = 'block';

  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password)
  };

  strength = Object.values(checks).filter(Boolean).length;

  // Update bars
  bars.forEach((bar, index) => {
    if (index < strength) {
      const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50'];
      bar.style.background = colors[Math.min(strength - 1, 3)];
    } else {
      bar.style.background = 'var(--border)';
    }
  });

  // Update text
  const messages = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#4caf50'];
  strengthText.textContent = messages[strength - 1] || '';
  strengthText.style.color = colors[strength - 1] || 'var(--text-muted)';
};

// Toggle password visibility (reuse from login)
if (!window.togglePasswordVisibility) {
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
}
