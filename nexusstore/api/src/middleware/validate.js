import { ValidationError } from './errorHandler.js';

// Validation middleware factory
export function validate(schema) {
  return (req, res, next) => {
    try {
      const { error } = validateData(req.body, schema);
      if (error) {
        throw new ValidationError(error);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Simple validation function
function validateData(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Le champ "${field}" est requis`);
      continue;
    }

    // Skip optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rules.type) {
      const actualType = typeof value;
      if (rules.type === 'email') {
        if (!isValidEmail(value)) {
          errors.push(`Le champ "${field}" doit être une adresse email valide`);
        }
      } else if (rules.type === 'number') {
        if (isNaN(Number(value))) {
          errors.push(`Le champ "${field}" doit être un nombre`);
        }
      } else if (actualType !== rules.type) {
        errors.push(`Le champ "${field}" doit être de type ${rules.type}`);
      }
    }

    // Min length
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push(`Le champ "${field}" doit contenir au moins ${rules.minLength} caractères`);
    }

    // Max length
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`Le champ "${field}" ne peut pas dépasser ${rules.maxLength} caractères`);
    }

    // Min value
    if (rules.min !== undefined && Number(value) < rules.min) {
      errors.push(`Le champ "${field}" doit être supérieur ou égal à ${rules.min}`);
    }

    // Max value
    if (rules.max !== undefined && Number(value) > rules.max) {
      errors.push(`Le champ "${field}" doit être inférieur ou égal à ${rules.max}`);
    }

    // Enum check
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Le champ "${field}" doit être l'une des valeurs: ${rules.enum.join(', ')}`);
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`Le champ "${field}" a un format invalide`);
    }
  }

  return {
    error: errors.length > 0 ? errors.join('. ') : null
  };
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation schemas
export const schemas = {
  register: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 8, maxLength: 100 },
    role: { type: 'string', enum: ['user', 'developer'] }
  },

  login: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' }
  },

  createApp: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 5000 },
    short_description: { type: 'string', maxLength: 255 },
    category: { required: true, type: 'string', maxLength: 50 },
    price: { type: 'number', min: 0, max: 1000 },
    type: { required: true, type: 'string', enum: ['apk', 'aab', 'pwa'] },
    version: { required: true, type: 'string', maxLength: 20 }
  },

  updateApp: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 5000 },
    short_description: { type: 'string', maxLength: 255 },
    category: { type: 'string', maxLength: 50 },
    price: { type: 'number', min: 0, max: 1000 },
    version: { type: 'string', maxLength: 20 }
  },

  review: {
    rating: { required: true, type: 'number', min: 1, max: 5 },
    comment: { type: 'string', maxLength: 1000 }
  }
};
