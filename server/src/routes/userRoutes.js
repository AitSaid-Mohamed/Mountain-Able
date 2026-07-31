import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  requestOfficerAccount,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  officerRequestRules,
  updateStatusRules,
  updateRoleRules,
} from '../middleware/validators/userValidators.js';

const router = Router();

// Public officer account request.
router.post('/officer-request', officerRequestRules, validate, requestOfficerAccount);

// Admin-only user management.
router.use(protect, restrictTo('admin'));
router.get('/', listUsers);
router.get('/:id', getUser);
router.patch('/:id/status', updateStatusRules, validate, updateUserStatus);
router.patch('/:id/role', updateRoleRules, validate, updateUserRole);
router.delete('/:id', deleteUser);

export default router;
