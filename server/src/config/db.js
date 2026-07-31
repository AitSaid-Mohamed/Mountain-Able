import mongoose from 'mongoose';
import config from './env.js';

/**
 * Open the shared Mongoose connection to MongoDB.
 * Resolves once the connection is ready so callers can `await` it before
 * starting the HTTP server or running the seed script.
 *
 * @returns {Promise<typeof mongoose>} the connected mongoose instance
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose;
}

/** Gracefully close the Mongoose connection (used by the seed script). */
export async function disconnectDB() {
  await mongoose.connection.close();
}
