import { body } from 'express-validator';

/** Rules for creating a village. */
export const createVillageRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('region').trim().notEmpty().withMessage('Region is required.'),
  body('province').trim().notEmpty().withMessage('Province is required.'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required.'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required.'),
  body('municipalityId').optional().isMongoId().withMessage('municipalityId must be a valid id.'),
  body('altitude').optional().isInt({ min: 0 }).withMessage('Altitude must be a positive number.'),
  body('population').optional().isInt({ min: 0 }).withMessage('Population must be a positive number.'),
  body('shortDescription').optional().trim(),
];

/** Rules for updating a village — all fields optional. */
export const updateVillageRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty.'),
  body('region').optional().trim().notEmpty(),
  body('province').optional().trim().notEmpty(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  body('altitude').optional().isInt({ min: 0 }),
  body('population').optional().isInt({ min: 0 }),
];

/** Rules for the publish toggle. */
export const publishRules = [
  body('isPublished').isBoolean().withMessage('isPublished must be a boolean.'),
];
