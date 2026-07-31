import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * `validate` — express-validator result collector.
 * Place it after a chain of validation rules on a route. If any rule failed,
 * it forwards a 422 AppError whose `errors` is a field-keyed object
 * (`{ email: 'A valid email is required.', ... }`), matching the shape the
 * frontend forms consume. Otherwise control passes to the controller.
 *
 * @type {import('express').RequestHandler}
 */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const e of result.array()) {
    // Keep the first error per field.
    if (!errors[e.path]) errors[e.path] = e.msg;
  }
  return next(new AppError('Validation failed', 422, errors));
}
