import { body } from 'express-validator';

export const createAttractionRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('categoryId').isMongoId().withMessage('A valid categoryId is required.'),
  body('description').optional().trim(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
];

export const updateAttractionRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('categoryId').optional().isMongoId().withMessage('categoryId must be a valid id.'),
  body('description').optional().trim(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
];
