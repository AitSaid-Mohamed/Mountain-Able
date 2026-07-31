import dotenv from 'dotenv';

// Load variables from `.env` into process.env as early as possible.
dotenv.config();

/**
 * Centralised, validated view of the environment configuration.
 * Every module imports config from here instead of reading process.env
 * directly, so the required variables are checked in exactly one place.
 */
const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/mountain_able',
  jwtSecret: process.env.JWT_SECRET ?? 'insecure-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  seedPassword: process.env.SEED_PASSWORD ?? 'Password123!',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
};

/** Fail fast in production if a critical secret is left at its default. */
if (config.nodeEnv === 'production' && config.jwtSecret === 'insecure-dev-secret') {
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

export default config;
