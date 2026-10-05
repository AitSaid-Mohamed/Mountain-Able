import dotenv from 'dotenv';

// Load variables from `.env` into process.env as early as possible.
dotenv.config();

/**
 * Centralised, validated view of the environment configuration.
 * Every module imports config from here instead of reading process.env
 * directly, so the required variables are checked in exactly one place.
 */
const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

/**
 * Read an environment variable, treating an empty or whitespace-only value as
 * absent.
 *
 * `??` alone is not enough: `JWT_SECRET=` in a `.env` file or a variable left
 * blank in a hosting dashboard yields `''`, which is neither null nor
 * undefined, so `??` would accept it and the application would sign tokens with
 * an empty secret. A blank value in a dashboard is the likeliest way this
 * happens in practice.
 */
const env = (name, fallback) => {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value;
};

// JWT_SECRET has no production fallback: the server must refuse to start
// without it rather than sign tokens with a guessable default. In development
// a clearly-labelled placeholder is allowed for convenience.
if (isProd && (!env('JWT_SECRET') || env('JWT_SECRET').length < 16)) {
  throw new Error(
    'FATAL: JWT_SECRET is not set (or is too short) in production. ' +
      'Set a long, random JWT_SECRET before starting the server.'
  );
}

const config = {
  port: parseInt(env('PORT', '5000'), 10),
  nodeEnv,
  mongoUri: env('MONGODB_URI', 'mongodb://127.0.0.1:27017/mountain_able'),
  jwtSecret: env('JWT_SECRET', isProd ? undefined : 'insecure-dev-only-secret'),
  jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
  seedPassword: env('SEED_PASSWORD', 'Password123!'),
  /**
   * Allowed browser origins, as an array.
   *
   * `CLIENT_ORIGIN` accepts a **comma-separated list** so a deployed frontend
   * and a local development server can be allowed at the same time — useful
   * when debugging production data from a laptop, and necessary because Vercel
   * serves preview deployments from their own URLs.
   *
   * Each entry must be a bare origin (`https://host`), with no trailing slash:
   * the CORS `Origin` header never carries one, so a trailing slash silently
   * fails to match. Trailing slashes are therefore stripped here rather than
   * left as a configuration trap.
   */
  clientOrigins: env('CLIENT_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),

  uploadDir: env('UPLOAD_DIR', 'uploads'),

  /**
   * Cloudinary connection string. When set, uploaded images are stored in
   * Cloudinary and the returned HTTPS URL is persisted instead of a local
   * `/uploads/...` path.
   *
   * This is not an optimisation: Render's filesystem is ephemeral and is wiped
   * on every restart and redeploy, so locally-stored uploads disappear without
   * warning. Left unset, the server keeps writing to disk, which is correct for
   * development.
   */
  cloudinaryUrl: env('CLOUDINARY_URL', null),
};

export default config;
