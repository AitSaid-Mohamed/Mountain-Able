import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * `protect` — authentication guard.
 * Reads the Bearer token from the Authorization header, verifies it, loads
 * the corresponding user and attaches it to `req.user`. Rejects requests with
 * a missing/invalid token or a user that no longer exists or is suspended.
 */
export const protect = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new AppError('You are not logged in. Please provide a valid token.', 401));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }

  const user = await User.findById(decoded.sub).select('+tokenVersion');
  if (!user) {
    return next(new AppError('The user for this token no longer exists.', 401));
  }
  // Token revocation: a token minted before the user's tokenVersion was bumped
  // (password change, suspension) is no longer valid.
  if ((decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    return next(new AppError('Your session has expired. Please log in again.', 401));
  }
  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended.', 403));
  }

  req.user = user;
  next();
});

/**
 * `optionalAuth` — best-effort authentication for public endpoints that behave
 * differently for logged-in users (e.g. an owning officer seeing their own
 * unpublished villages). Attaches `req.user` when a valid token is present and
 * silently continues otherwise — it never rejects the request.
 */
export const optionalAuth = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).select('+tokenVersion');
    if (user && user.status !== 'suspended' && (decoded.tv ?? 0) === (user.tokenVersion ?? 0)) {
      req.user = user;
    }
  } catch {
    // Ignore invalid tokens on optional-auth routes.
  }
  next();
});

/**
 * `restrictTo(...roles)` — authorization guard.
 * Must run after `protect`. Allows the request only if the authenticated
 * user's role is one of the permitted roles.
 *
 * @param {...('tourist'|'officer'|'admin'|'authority')} roles
 * @returns {import('express').RequestHandler}
 */
export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };

/**
 * `requireActive` — blocks write operations for accounts that are not yet
 * active. A `pending` officer can log in and read, but any mutating endpoint
 * guarded by this middleware is refused until an admin approves the account.
 * Must run after `protect`.
 *
 * @type {import('express').RequestHandler}
 */
export const requireActive = (req, _res, next) => {
  if (req.user?.status === 'pending') {
    return next(
      new AppError('Your account is awaiting admin approval and cannot perform this action yet.', 403)
    );
  }
  next();
};
