import { body } from 'express-validator';
import { SUPPORT_STATUS } from '../../models/SupportMessage.js';

/** Public support submission. */
export const createSupportRules = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('A message is required.')
    .isLength({ max: 5000 })
    .withMessage('A message may be at most 5000 characters.'),
];

/** Admin: mark a support message handled or unhandled. */
export const updateSupportRules = [
  body('status')
    .isIn(SUPPORT_STATUS)
    .withMessage(`status must be one of: ${SUPPORT_STATUS.join(', ')}.`),
];
