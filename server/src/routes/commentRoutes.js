import { Router } from 'express';
import {
  listVillageComments,
  createComment,
  updateComment,
  deleteComment,
  listPendingComments,
  moderateComment,
  listMyComments,
} from '../controllers/commentController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { canEditComment, canDeleteComment } from '../middleware/ownsComment.js';
import { validate } from '../middleware/validate.js';
import {
  createCommentRules,
  updateCommentRules,
  moderateCommentRules,
} from '../middleware/validators/commentValidators.js';

/** Nested under /api/villages/:villageId/comments. */
export const commentNestedRouter = Router({ mergeParams: true });

// optionalAuth so the author sees their own pending review; still public.
commentNestedRouter.get('/', optionalAuth, listVillageComments);
commentNestedRouter.post(
  '/',
  protect,
  restrictTo('tourist'),
  createCommentRules,
  validate,
  createComment
);

/** Top-level /api/comments — author edits, deletion, admin moderation. */
export const commentTopRouter = Router();

// The caller's own reviews (declared before /:id routes).
commentTopRouter.get('/me', protect, listMyComments);

// Admin moderation queue (declared before /:id routes for clarity).
commentTopRouter.get('/pending', protect, restrictTo('admin'), listPendingComments);

commentTopRouter.patch(
  '/:id/moderate',
  protect,
  restrictTo('admin'),
  moderateCommentRules,
  validate,
  moderateComment
);

// Authorship, the 24-hour edit window and the admin-moderator exception on
// delete live in middleware like every other authorisation rule in the API —
// the controllers below assume the check has already passed.
commentTopRouter.patch('/:id', protect, canEditComment, updateCommentRules, validate, updateComment);
commentTopRouter.delete('/:id', protect, canDeleteComment, deleteComment);
