import User from '../models/User.js';
import Municipality from '../models/Municipality.js';
import OfficerRequest from '../models/OfficerRequest.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildMeta } from '../utils/pagination.js';
import APIFeatures from '../utils/APIFeatures.js';

/** GET /api/users — admin; filter by ?role= and ?status=, paginated. */
export const listUsers = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;

  const total = await User.countDocuments(filter);
  const features = new APIFeatures(User.find(), req.query)
    .filter(filter)
    .sort({ newest: '-createdAt', name: 'firstName' }, 'newest')
    .paginate({ defaultLimit: 20, maxLimit: 100 });
  const users = await features.query.populate('municipalityId', 'name region');
  sendSuccess(res, users, buildMeta(total, features.page, features.limit));
});

/** GET /api/users/:id — admin. */
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('municipalityId', 'name region');
  if (!user) return next(new AppError('User not found.', 404));
  sendSuccess(res, user);
});

/** PATCH /api/users/:id/status — admin activates or suspends an account. */
export const updateUserStatus = catchAsync(async (req, res, next) => {
  const update = { status: req.body.status };
  // Suspending must immediately invalidate the user's existing tokens.
  if (req.body.status === 'suspended') update.$inc = { tokenVersion: 1 };
  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new AppError('User not found.', 404));
  sendSuccess(res, user);
});

/** PATCH /api/users/:id/role — admin changes a user's role. */
export const updateUserRole = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  user.role = req.body.role;
  if (req.body.municipalityId !== undefined) user.municipalityId = req.body.municipalityId;
  // An officer must reference a municipality (enforced by the schema validator).
  if (user.role === 'officer' && !user.municipalityId) {
    return next(new AppError('An officer must be linked to a municipality.', 422, {
      municipalityId: 'Required for officers.',
    }));
  }
  if (user.role !== 'officer') user.municipalityId = undefined;
  await user.save({ validateBeforeSave: true });
  sendSuccess(res, user);
});

/** DELETE /api/users/:id — admin. */
export const deleteUser = catchAsync(async (req, res, next) => {
  if (req.user._id.equals(req.params.id)) {
    return next(new AppError('You cannot delete your own account.', 400));
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  sendSuccess(res, { deleted: true, id: user._id });
});

/**
 * POST /api/users/officer-request — public officer account request.
 * Creates a user with role `officer` and status `pending`, linking (or
 * creating) the named municipality. A pending officer can log in but is blocked
 * from write operations until an admin approves the account.
 */
export const requestOfficerAccount = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, municipalityName, region, message } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new AppError('An account with that email already exists.', 409));

  // Link to an existing municipality by name, or create a placeholder the admin
  // can complete later.
  let municipality = await Municipality.findOne({
    name: new RegExp(`^${municipalityName}$`, 'i'),
  });
  if (!municipality) {
    municipality = await Municipality.create({
      name: municipalityName,
      region,
      province: req.body.province || region,
      contactEmail: email.toLowerCase(),
    });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'officer',
    status: 'pending',
    municipalityId: municipality._id,
  });

  // Persist an auditable request record (keeps the applicant's free-text
  // message and feeds the admin moderation queue).
  const request = await OfficerRequest.create({
    requesterName: `${firstName} ${lastName}`,
    email: email.toLowerCase(),
    municipalityName,
    region,
    province: req.body.province,
    message,
  });

  sendSuccess(
    res,
    {
      user,
      request,
      message: 'Your officer account request has been submitted and is awaiting approval.',
    },
    undefined,
    201
  );
});
