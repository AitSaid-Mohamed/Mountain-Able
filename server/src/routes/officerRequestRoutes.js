import { Router } from 'express';
import {
  listOfficerRequests,
  reviewOfficerRequest,
} from '../controllers/officerRequestController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewOfficerRequestRules } from '../middleware/validators/userValidators.js';

const router = Router();

// Officer-request management is admin-only.
router.use(protect, restrictTo('admin'));

router.get('/', listOfficerRequests);
router.patch('/:id', reviewOfficerRequestRules, validate, reviewOfficerRequest);

export default router;
