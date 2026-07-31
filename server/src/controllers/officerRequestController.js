import OfficerRequest from '../models/OfficerRequest.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildMeta } from '../utils/pagination.js';
import APIFeatures from '../utils/APIFeatures.js';

/**
 * GET /api/officer-requests — admin. Officer account requests, newest first,
 * paginated. Filter by `?status=` (pending | approved | rejected).
 */
export const listOfficerRequests = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const total = await OfficerRequest.countDocuments(filter);
  const features = new APIFeatures(OfficerRequest.find(), req.query)
    .filter(filter)
    .sort({ newest: '-createdAt' }, 'newest')
    .paginate({ defaultLimit: 20, maxLimit: 100 });
  const requests = await features.query.populate('reviewedBy', 'firstName lastName');
  sendSuccess(res, requests, buildMeta(total, features.page, features.limit));
});

/**
 * PATCH /api/officer-requests/:id — admin approves or rejects a request.
 * Records the reviewer and time, and updates the linked officer account:
 * approving activates it, rejecting suspends it.
 */
export const reviewOfficerRequest = catchAsync(async (req, res, next) => {
  const request = await OfficerRequest.findById(req.params.id);
  if (!request) return next(new AppError('Officer request not found.', 404));

  request.status = req.body.status;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  // Reflect the decision on the linked officer account, if it still exists.
  const officer = await User.findOne({ email: request.email, role: 'officer' });
  if (officer) {
    officer.status = req.body.status === 'approved' ? 'active' : 'suspended';
    await officer.save();
  }

  sendSuccess(res, { request, officerStatus: officer?.status ?? null });
});
