import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * `canEditComment` — authorship and edit-window guard for `PATCH /api/comments/:id`.
 *
 * Only the author may edit, and only within 24 hours of posting. Admins are
 * deliberately **not** given an exception: an admin's tool for a bad review is
 * moderation (`PATCH /:id/moderate`) or deletion, never rewriting someone else's
 * words under their name.
 *
 * Loads the comment onto `req.comment` so the controller does not re-query.
 */
export const canEditComment = catchAsync(async (req, _res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found.', 404));

  if (!comment.userId.equals(req.user._id)) {
    return next(new AppError('You can only edit your own comment.', 403));
  }
  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return next(new AppError('Comments can only be edited within 24 hours of posting.', 403));
  }

  req.comment = comment;
  next();
});

/**
 * `canDeleteComment` — authorship-or-admin guard for `DELETE /api/comments/:id`.
 *
 * The author may withdraw their own review at any time (no edit window: removing
 * your own words is not the same as changing them after approval), and an admin
 * may remove any review as a moderation action.
 *
 * Loads the comment onto `req.comment`.
 */
export const canDeleteComment = catchAsync(async (req, _res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found.', 404));

  const isAuthor = comment.userId.equals(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own comment.', 403));
  }

  req.comment = comment;
  next();
});
