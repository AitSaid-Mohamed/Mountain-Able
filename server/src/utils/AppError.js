/**
 * Operational error with an attached HTTP status code.
 * Thrown anywhere in the request lifecycle and translated into a JSON
 * response by the centralised error handler. `isOperational` distinguishes
 * expected errors (bad input, missing resource) from unexpected bugs.
 */
export default class AppError extends Error {
  /**
   * @param {string} message  human-readable message returned to the client
   * @param {number} statusCode  HTTP status code (defaults to 500)
   * @param {Array}  [errors]  optional field-level validation errors
   */
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
