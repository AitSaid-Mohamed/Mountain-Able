import { Router } from 'express';
import {
  createSupportMessage,
  listSupportMessages,
  updateSupportMessage,
  deleteSupportMessage,
} from '../controllers/supportController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supportLimiter } from '../middleware/rateLimit.js';
import { createSupportRules, updateSupportRules } from '../middleware/validators/supportValidators.js';

const router = Router();

/**
 * Submission is public — a visitor who cannot reach support is exactly the
 * person who most needs to. `optionalAuth` attributes the message when the
 * sender happens to be signed in without ever rejecting the request.
 *
 * It is the only public *write* endpoint besides registration and the officer
 * request, so it carries its own limiter in every environment: an unauthenticated
 * POST that persists free text is the obvious spam target, and the general
 * limiter runs in production only.
 */
router.post('/', supportLimiter, optionalAuth, createSupportRules, validate, createSupportMessage);

// Reading and triaging the inbox is admin-only.
router.use(protect, restrictTo('admin'));

router.get('/', listSupportMessages);
router.patch('/:id', updateSupportRules, validate, updateSupportMessage);
router.delete('/:id', deleteSupportMessage);

export default router;
