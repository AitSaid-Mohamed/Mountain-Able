import { body } from 'express-validator';
import { ROLES, USER_STATUS } from '../../models/User.js';
import { passwordRule } from './passwordRule.js';

/** Public officer account request. */
export const officerRequestRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  passwordRule,
  body('municipalityName').trim().notEmpty().withMessage('Municipality name is required.'),
  body('region').trim().notEmpty().withMessage('Region is required.'),
  body('message').optional().trim(),
];

/** Admin: change a user's status. */
export const updateStatusRules = [
  body('status').isIn(USER_STATUS).withMessage(`status must be one of: ${USER_STATUS.join(', ')}.`),
];

/** Admin: change a user's role. */
export const updateRoleRules = [
  body('role').isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}.`),
  body('municipalityId').optional().isMongoId().withMessage('municipalityId must be a valid id.'),
];

/** Admin: approve or reject an officer account request. */
export const reviewOfficerRequestRules = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage("status must be 'approved' or 'rejected'."),
];
