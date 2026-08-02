import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

import config from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build and configure the Express application (without starting it), so it can
 * be imported by both the HTTP bootstrap and, later, integration tests.
 *
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  // Trust the reverse proxy (needed for correct client IPs behind proxies,
  // used by the rate limiter).
  app.set('trust proxy', 1);

  // --- Security middleware -------------------------------------------------
  // Allow images under /uploads to be embedded by the separate frontend origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.clientOrigin, credentials: true }));

  // --- Body parsing --------------------------------------------------------
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Strip keys containing `$` / `.` from req.body/params/query to prevent
  // NoSQL operator injection.
  app.use(mongoSanitize());

  if (config.nodeEnv !== 'test') app.use(morgan('dev'));

  // Serve locally uploaded images (multer target) as static files. Defence in
  // depth: even though only magic-byte-verified images are stored, force
  // no-sniff and a null CSP so a served file can never be interpreted as HTML
  // or execute script in the browser.
  app.use(
    '/uploads',
    express.static(path.join(__dirname, '..', config.uploadDir), {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
      },
    })
  );

  // --- Rate limiting -------------------------------------------------------
  // Disabled under NODE_ENV=test so automated end-to-end runs aren't throttled.
  if (config.nodeEnv !== 'test') {
    app.use('/api/auth', authLimiter); // stricter limit on authentication
    app.use('/api', generalLimiter); // 100 requests / 15 min per IP
  }

  // --- API routes ---------------------------------------------------------
  app.use('/api', apiRouter);

  // --- Error handling (must be last) --------------------------------------
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
