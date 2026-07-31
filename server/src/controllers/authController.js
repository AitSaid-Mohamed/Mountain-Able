import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Fields a user is allowed to change on their own profile. */
const EDITABLE_PROFILE_FIELDS = ['firstName', 'lastName', 'avatar', 'phone', 'city'];

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

  const token = signToken(user.id);
  sendSuccess(res, { token, user }, undefined, 201);
});

/**
 * POST /api/auth/login
 * Authenticate with email + password and return a JWT access token.
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Password is `select: false`, so request it explicitly for comparison.
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended.', 403));
  }

  user.password = undefined; // never serialise the hash
  const token = signToken(user.id);
  sendSuccess(res, { token, user });
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
export const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, { user: req.user });
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
