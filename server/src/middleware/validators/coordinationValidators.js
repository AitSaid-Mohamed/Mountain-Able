import { body, query } from 'express-validator';
import { SERVICE_GROUPS } from '../../models/ServiceType.js';
import { RESPONSE_TYPES } from '../../models/CoordinationResponse.js';

/** Admin: create a service type. */
export const createServiceTypeRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('group').isIn(SERVICE_GROUPS).withMessage(`group must be one of: ${SERVICE_GROUPS.join(', ')}.`),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer.'),
];

/** Admin: update a service type. */
export const updateServiceTypeRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('group').optional().isIn(SERVICE_GROUPS).withMessage(`group must be one of: ${SERVICE_GROUPS.join(', ')}.`),
  body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
];

/** Officer: declare a capability. */
export const upsertCapabilityRules = [
  body('serviceTypeId').isMongoId().withMessage('A valid service type is required.'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('contactEmail').optional({ values: 'falsy' }).isEmail().withMessage('A valid contact email is required.').normalizeEmail(),
  body('contactName').optional().trim(),
  body('contactPhone').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
];

/** Officer: amend a capability. */
export const updateCapabilityRules = [
  body('description').optional().trim().isLength({ max: 1000 }),
  body('contactEmail').optional({ values: 'falsy' }).isEmail().withMessage('A valid contact email is required.').normalizeEmail(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
];

/** Officer: raise a request. */
export const createRequestRules = [
  body('serviceTypeId').isMongoId().withMessage('A valid service type is required.'),
  body('title').trim().notEmpty().withMessage('A title is required.').isLength({ max: 160 }),
  body('details').optional().trim().isLength({ max: 3000 }),
  body('neededFrom').optional({ values: 'falsy' }).isISO8601().withMessage('neededFrom must be a date.').toDate(),
  body('neededTo')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('neededTo must be a date.')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.neededFrom && value < new Date(req.body.neededFrom)) {
        throw new Error('The end date cannot be before the start date.');
      }
      return true;
    }),
  body('peopleCount').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('peopleCount must be a positive integer.'),
  body('radiusKm').optional().isInt({ min: 1, max: 500 }).withMessage('radiusKm must be between 1 and 500.'),
];

/**
 * Officer: close a request.
 *
 * `expired` is absent on purpose — it is a system transition, never something a
 * client may assert.
 */
export const closeRequestRules = [
  body('status')
    .isIn(['fulfilled', 'unmet', 'cancelled'])
    .withMessage("status must be 'fulfilled', 'unmet' or 'cancelled'."),
  body('closedNote').optional().trim().isLength({ max: 1000 }),
  body('fulfilledByMunicipalityId').optional({ values: 'falsy' }).isMongoId().withMessage('A valid municipality id is required.'),
];

/** Officer: respond to a request. */
export const respondRules = [
  body('type').isIn(RESPONSE_TYPES).withMessage(`type must be one of: ${RESPONSE_TYPES.join(', ')}.`),
  body('message').optional().trim().isLength({ max: 2000 }),
  body('contactEmail').optional({ values: 'falsy' }).isEmail().withMessage('A valid contact email is required.').normalizeEmail(),
];

/** Officer: preview candidates. */
export const candidateRules = [
  query('serviceTypeId').optional().isMongoId().withMessage('A valid service type is required.'),
  query('radiusKm').optional().isInt({ min: 1, max: 500 }).withMessage('radiusKm must be between 1 and 500.'),
];
