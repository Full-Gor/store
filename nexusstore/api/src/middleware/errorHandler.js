// Central error handler middleware
export function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Une erreur est survenue';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Non autorisé';
  } else if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Cette ressource existe déjà';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Référence invalide';
  } else if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'Fichier non trouvé';
  }

  // Don't expose internal error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Une erreur interne est survenue';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
}

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès interdit') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit avec une ressource existante') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
