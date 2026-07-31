import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Sign a JWT access token for a user id.
 *
 * @param {string} userId  the Mongo ObjectId (as string) of the user
 * @returns {string} a signed JWT
 */
export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verify and decode a JWT access token.
 *
 * @param {string} token  the raw token from the Authorization header
 * @returns {{ sub: string, iat: number, exp: number }} decoded payload
 * @throws {jwt.JsonWebTokenError} if the token is invalid or expired
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
