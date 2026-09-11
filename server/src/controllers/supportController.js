import SupportMessage from '../models/SupportMessage.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildMeta } from '../utils/pagination.js';
import APIFeatures from '../utils/APIFeatures.js';

/**
 * POST /api/support — public. Records a support message for admins to read.
 *
 * Runs under `optionalAuth`, so a signed-in sender is attributed automatically
 * while visitors can still write in. The response deliberately returns only the
 * created id and timestamp: the endpoint is public, and echoing the stored
 * document back adds nothing the sender does not already have.
 */
export const createSupportMessage = catchAsync(async (req, res) => {
  const doc = await SupportMessage.create({
    email: req.body.email,
    message: req.body.message,
    userId: req.user?._id ?? null,
  });
  sendSuccess(res, { _id: doc._id, createdAt: doc.createdAt }, undefined, 201);
});

/**
 * GET /api/support — admin. Newest first, paginated, filter by `?status=`.
 */
export const listSupportMessages = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const total = await SupportMessage.countDocuments(filter);
  const features = new APIFeatures(SupportMessage.find(), req.query)
    .filter(filter)
    .sort({ newest: '-createdAt' }, 'newest')
    .paginate({ defaultLimit: 20, maxLimit: 100 });
  const messages = await features.query
    .populate('userId', 'firstName lastName role')
    .populate('handledBy', 'firstName lastName');
  sendSuccess(res, messages, buildMeta(total, features.page, features.limit));
});

/**
 * PATCH /api/support/:id — admin marks a message handled (or back to new).
 * Only `status` is settable; the message body is the sender's words and is
 * never editable from the admin side.
 */
export const updateSupportMessage = catchAsync(async (req, res, next) => {
  const handled = req.body.status === 'handled';
  const message = await SupportMessage.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      handledBy: handled ? req.user._id : null,
      handledAt: handled ? new Date() : null,
    },
    { new: true, runValidators: true }
  ).populate('handledBy', 'firstName lastName');

  if (!message) return next(new AppError('Support message not found.', 404));
  sendSuccess(res, message);
});

/** DELETE /api/support/:id — admin. */
export const deleteSupportMessage = catchAsync(async (req, res, next) => {
  const message = await SupportMessage.findByIdAndDelete(req.params.id);
  if (!message) return next(new AppError('Support message not found.', 404));
  sendSuccess(res, { deleted: true, id: message._id });
});
