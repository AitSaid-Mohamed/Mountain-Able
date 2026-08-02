import { body } from 'express-validator';

export const addVisitedRules = [
  body('villageId').isMongoId().withMessage('A valid villageId is required.'),
  body('visitedAt').optional().isISO8601().withMessage('visitedAt must be a valid date.'),
  body('note').optional().isString().isLength({ max: 280 }).withMessage('Note is too long (max 280).'),
];

export const updateVisitedRules = [
  body('visitedAt').optional().isISO8601().withMessage('visitedAt must be a valid date.'),
  body('note').optional().isString().isLength({ max: 280 }).withMessage('Note is too long (max 280).'),
];

export const addFavoriteRules = [
  body('villageId').isMongoId().withMessage('A valid villageId is required.'),
];
