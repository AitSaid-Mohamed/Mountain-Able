import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import config from './config/env.js';
import { warnIfEphemeralStorage } from './services/imageStore.js';

/** HTTP bootstrap: connect to MongoDB, then start listening. */
async function start() {
  try {
    await connectDB();
    warnIfEphemeralStorage();
    const app = createApp();
    // Bind to 0.0.0.0, not the default loopback: a container platform routes
    // traffic to the container's own address, so a server listening only on
    // localhost is unreachable from outside and the health check never passes.
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Mountain-Able API running on port ${config.port} (${config.nodeEnv})`);
      console.log(`   Allowed origins: ${config.clientOrigins.join(', ')}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
