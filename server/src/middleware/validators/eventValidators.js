import { body } from 'express-validator';

/** Custom check: endDate must be on or after startDate. */
const endAfterStart = (endDate, { req }) => {
  const start = new Date(req.body.startDate);
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) throw new Error('A valid endDate is required.');
  if (end < start) throw new Error('endDate must be on or after startDate.');
  return true;
};

export const createEventRules = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('startDate').isISO8601().withMessage('A valid startDate is required.'),
  body('endDate').isISO8601().withMessage('A valid endDate is required.').bail().custom(endAfterStart),
  body('description').optional().trim(),
];

export const updateEventRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid date.'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid date.')
    .bail()
    .custom((endDate, { req }) => {
      // Only cross-validate when both dates are present in the update.
      if (req.body.startDate) return endAfterStart(endDate, { req });
      return true;
    }),
  body('description').optional().trim(),
];
