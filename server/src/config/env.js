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

// JWT_SECRET has no production fallback: the server must refuse to start
// without it rather than sign tokens with a guessable default. In development
// a clearly-labelled placeholder is allowed for convenience.
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)) {
  throw new Error(
    'FATAL: JWT_SECRET is not set (or is too short) in production. ' +
      'Set a long, random JWT_SECRET before starting the server.'
  );
}

const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/mountain_able',
  jwtSecret: process.env.JWT_SECRET ?? (isProd ? undefined : 'insecure-dev-only-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  seedPassword: process.env.SEED_PASSWORD ?? 'Password123!',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
};

export default config;
