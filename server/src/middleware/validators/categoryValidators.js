import { body } from 'express-validator';

export const createCategoryRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('icon').optional().trim(),
  body('slug').optional().trim().isSlug().withMessage('slug must be URL-friendly.'),
];

export const updateCategoryRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('icon').optional().trim(),
  body('slug').optional().trim().isSlug().withMessage('slug must be URL-friendly.'),
];
