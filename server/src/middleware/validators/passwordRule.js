import { body } from 'express-validator';

/**
 * A small blocklist of passwords too common to allow, regardless of length.
 * Length is the primary defence (see below); this only rejects the obvious.
 */
const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwertyuiop', 'iloveyou', 'letmein123', 'welcome1', 'admin123', 'changeme',
  'mountainable', 'password!', 'passw0rd', 'qwerty123',
]);

/**
 * Strong-password validation chain. Requires at least 8 characters (length
 * matters more than composition, so no symbol/case rules are imposed) and
 * rejects trivially guessable values: a common password, a single repeated
 * character, or the user's own email local-part.
 */
export const passwordRule = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.')
  .bail()
  .custom((value, { req }) => {
    const pw = String(value);
    if (COMMON.has(pw.toLowerCase())) throw new Error('That password is too common — choose a less guessable one.');
    if (/^(.)\1+$/.test(pw)) throw new Error('That password is too simple — choose a less guessable one.');
    const emailLocal = String(req.body.email ?? '').split('@')[0].toLowerCase();
    if (emailLocal && emailLocal.length >= 3 && pw.toLowerCase().includes(emailLocal)) {
      throw new Error('Password must not contain your email.');
    }
    return true;
  });
