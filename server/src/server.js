import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import config from './config/env.js';

/** HTTP bootstrap: connect to MongoDB, then start listening. */
async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`🚀 Mountain-Able API running on http://localhost:${config.port} (${config.nodeEnv})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
