import config from '../config/env.js';
import AppError from '../utils/AppError.js';

/**
 * 404 handler for unmatched routes. Forwards a standard AppError so the
 * response shape stays consistent with every other error.
 */
export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Centralised error handler. Translates any thrown error into the platform's
 * consistent JSON error shape: `{ success: false, message, errors? }`.
 * Known cases (validation, duplicate key, cast, JWT) are mapped to friendly
 * 4xx responses; anything else becomes a generic 500.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity (4 args).
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? 'Internal server error';
  let errors = err.errors;

  // Mongoose validation error → 422 with a field-keyed error object.
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.values(err.errors).map((e) => [e.path, e.message]));
  }

  // Duplicate unique key (e.g. email, slug) → 409.
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `A record with that ${field} already exists.`;
  }

  // Multer upload error (file too large, unexpected field, …) → 400.
  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image exceeds the 5 MB size limit.' : `Upload error: ${err.message}`;
  }

  // Invalid ObjectId or other cast error → 400.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  if (statusCode >= 500) {
    console.error('💥 Unhandled error:', err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (config.nodeEnv === 'development' && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
}
