import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { pick } from '../utils/pick.js';

/** Fields a user is allowed to change on their own profile. */
const EDITABLE_PROFILE_FIELDS = ['firstName', 'lastName', 'avatar', 'phone', 'city'];

// Per-account brute-force policy.
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes
// A bcrypt hash to compare against when the email is unknown, so a missing user
// costs the same time as a wrong password (defeats timing-based enumeration).
const DUMMY_HASH = bcrypt.hashSync('mountain-able-dummy-password', 12);

/**
 * POST /api/auth/register
 * Public self-service registration — tourists only. Other roles are created
 * by an admin or the seed script, so the role is forced to `tourist` here.
 */
export const register = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, phone, city } = req.body;

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    city,
    role: 'tourist',
    status: 'active',
  });

  const token = signToken(user.id, user.tokenVersion);
  sendSuccess(res, { token, user }, undefined, 201);
});

/**
 * POST /api/auth/login
 * Authenticate with email + password and return a JWT access token.
 *
 * Security properties:
 *  - one generic failure message and status for both unknown-email and
 *    wrong-password (no user enumeration), with a dummy hash comparison so the
 *    two paths take the same time (no timing enumeration);
 *  - per-account throttling: after MAX_ATTEMPTS consecutive failures the
 *    account is locked for LOCK_MS, defeating IP-rotating brute force.
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const genericFail = new AppError('Incorrect email or password.', 401);

  const user = await User.findOne({ email: email?.toLowerCase() }).select(
    '+password +tokenVersion +failedLoginAttempts +lockUntil'
  );

  if (!user) {
    // Equalise timing against the wrong-password path.
    await bcrypt.compare(password ?? '', DUMMY_HASH);
    return next(genericFail);
  }

  if (user.isLocked()) {
    const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return next(new AppError(`Too many failed attempts. Try again in about ${mins} minute(s).`, 429));
  }

  const ok = await user.comparePassword(password ?? '');
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    return next(genericFail);
  }

  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended.', 403));
  }

  // Success — reset the throttle counters.
  if (user.failedLoginAttempts || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  user.password = undefined; // never serialise the hash
  await user.populate('municipalityId', 'name region province');
  const token = signToken(user.id, user.tokenVersion);
  sendSuccess(res, { token, user });
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile (municipality populated).
 */
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).populate('municipalityId', 'name region province');
  sendSuccess(res, { user });
});

/**
 * PATCH /api/auth/me
 * Update the authenticated user's own profile. Only whitelisted fields may be
 * changed here; role, status, email and password are intentionally excluded.
 */
export const updateMe = catchAsync(async (req, res) => {
  const updates = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  // A newly uploaded avatar image (multipart) wins over any avatar text field
  // and is stored as a local path, exactly like village images.
  if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, { user });
});
