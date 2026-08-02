import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload, verifyImageBytes } from '../middleware/upload.js';
import { passwordRule } from '../middleware/validators/passwordRule.js';

const router = Router();

/** Validation rules for tourist self-registration. */
const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  passwordRule,
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const updateMeRules = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('city').optional().trim(),
];

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getMe);
// `upload.single('avatar')` runs before validation so multipart text fields
// are parsed into req.body. It also accepts plain JSON requests (no file).
router.patch('/me', protect, upload.single('avatar'), verifyImageBytes, updateMeRules, validate, updateMe);

export default router;
