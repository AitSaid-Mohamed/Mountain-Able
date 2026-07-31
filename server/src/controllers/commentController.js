import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildMeta } from '../utils/pagination.js';
import APIFeatures from '../utils/APIFeatures.js';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/villages/:villageId/comments — public, approved only, newest first,
 * paginated.
 */
export const listVillageComments = catchAsync(async (req, res) => {
  const filter = { villageId: req.params.villageId, status: 'approved' };
  const total = await Comment.countDocuments(filter);
  const features = new APIFeatures(Comment.find(), req.query)
    .filter(filter)
    .sort({ newest: '-createdAt' }, 'newest')
    .paginate({ defaultLimit: 10, maxLimit: 50 });
  const comments = await features.query.populate('userId', 'firstName lastName avatar');
  sendSuccess(res, comments, buildMeta(total, features.page, features.limit));
});

/**
 * POST /api/villages/:villageId/comments — tourist posts a review.
 * Enforces one comment per user per village (409 on a second attempt).
 * The post-save hook recalculates the village rating automatically.
 */
export const createComment = catchAsync(async (req, res, next) => {
  const villageId = req.params.villageId;
  const existing = await Comment.findOne({ villageId, userId: req.user._id });
  if (existing) {
    return next(new AppError('You have already reviewed this village.', 409));
  }

  const comment = await Comment.create({
    content: req.body.content,
    rating: req.body.rating,
    userId: req.user._id,
    villageId,
  });
  sendSuccess(res, comment, undefined, 201);
});

/**
 * PATCH /api/comments/:id — the author may edit within 24h of creation.
 * Uses findByIdAndUpdate so the rating-recalculation query hook fires.
 */
export const updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found.', 404));

  if (!comment.userId.equals(req.user._id)) {
    return next(new AppError('You can only edit your own comment.', 403));
  }
  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return next(new AppError('Comments can only be edited within 24 hours of posting.', 403));
  }

  const updates = {};
  if (req.body.content !== undefined) updates.content = req.body.content;
  if (req.body.rating !== undefined) updates.rating = req.body.rating;

  const updated = await Comment.findByIdAndUpdate(comment._id, updates, {
    new: true,
    runValidators: true,
  });
  sendSuccess(res, updated);
});

/**
 * DELETE /api/comments/:id — the author or an admin may delete.
 * Uses findByIdAndDelete so the rating-recalculation query hook fires.
 */
export const deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found.', 404));

  const isAuthor = comment.userId.equals(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own comment.', 403));
  }

  await Comment.findByIdAndDelete(comment._id);
  sendSuccess(res, { deleted: true, id: comment._id });
});

/** GET /api/comments/pending — admin moderation queue, paginated. */
export const listPendingComments = catchAsync(async (req, res) => {
  const filter = { status: 'pending' };
  const total = await Comment.countDocuments(filter);
  const features = new APIFeatures(Comment.find(), req.query)
    .filter(filter)
    .sort({ newest: '-createdAt' }, 'newest')
    .paginate({ defaultLimit: 10, maxLimit: 50 });
  const comments = await features.query
    .populate('userId', 'firstName lastName avatar')
    .populate('villageId', 'name slug');
  sendSuccess(res, comments, buildMeta(total, features.page, features.limit));
});

/**
 * PATCH /api/comments/:id/moderate — admin approves or rejects a comment.
 * Uses findByIdAndUpdate so the village rating is recalculated.
 */
export const moderateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!comment) return next(new AppError('Comment not found.', 404));
  sendSuccess(res, comment);
});
