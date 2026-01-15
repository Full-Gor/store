import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { ValidationError, ConflictError, NotFoundError } from '../middleware/errorHandler.js';

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'developer' } = req.body;

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new ConflictError('Un compte avec cet email existe déjà');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), hashedPassword, name, role]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, email, password, name, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('Email ou mot de passe incorrect');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ValidationError('Email ou mot de passe incorrect');
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
export async function getCurrentUser(req, res) {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      created_at: req.user.created_at
    }
  });
}

// PUT /api/auth/me
export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if new email is taken
    if (email && email.toLowerCase() !== req.user.email) {
      const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), userId]);
      if (existing.rows.length > 0) {
        throw new ConflictError('Cet email est déjà utilisé');
      }
    }

    const result = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, name, role`,
      [name, email?.toLowerCase(), userId]
    );

    res.json({
      message: 'Profil mis à jour',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/auth/me/password
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Mot de passe actuel et nouveau requis');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    // Get current password hash
    const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ValidationError('Mot de passe actuel incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  // For JWT, logout is handled client-side by removing the token
  // This endpoint can be used for logging, session invalidation, etc.
  res.json({ message: 'Déconnexion réussie' });
}
