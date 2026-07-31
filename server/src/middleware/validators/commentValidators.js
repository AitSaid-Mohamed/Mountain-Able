import { body } from 'express-validator';

export const createCommentRules = [
  body('content').trim().notEmpty().withMessage('Comment content is required.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
];

export const updateCommentRules = [
  body('content').optional().trim().notEmpty().withMessage('Comment content cannot be empty.'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
];

export const moderateCommentRules = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage("Moderation status must be 'approved' or 'rejected'."),
];
