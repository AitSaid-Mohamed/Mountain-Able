import { body } from 'express-validator';

export const createMunicipalityRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('region').trim().notEmpty().withMessage('Region is required.'),
  body('province').trim().notEmpty().withMessage('Province is required.'),
  body('contactEmail').optional().isEmail().withMessage('contactEmail must be a valid email.'),
  body('phone').optional().trim(),
];

export const updateMunicipalityRules = [
  body('name').optional().trim().notEmpty(),
  body('region').optional().trim().notEmpty(),
  body('province').optional().trim().notEmpty(),
  body('contactEmail').optional().isEmail().withMessage('contactEmail must be a valid email.'),
  body('phone').optional().trim(),
];
