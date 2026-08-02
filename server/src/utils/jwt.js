import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Sign a JWT access token for a user id, embedding the user's current
 * `tokenVersion` so the token can be invalidated server-side by bumping it.
 *
 * @param {string} userId  the Mongo ObjectId (as string) of the user
 * @param {number} [tokenVersion=0]
 * @returns {string} a signed JWT
 */
export function signToken(userId, tokenVersion = 0) {
  return jwt.sign({ sub: userId, tv: tokenVersion }, config.jwtSecret, {
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
