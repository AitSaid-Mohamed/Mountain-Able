import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import villageRoutes from './villageRoutes.js';
import municipalityRoutes from './municipalityRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import userRoutes from './userRoutes.js';
import officerRequestRoutes from './officerRequestRoutes.js';
import statsRoutes from './statsRoutes.js';
import { attractionItemRouter } from './attractionRoutes.js';
import { eventTopRouter } from './eventRoutes.js';
import { commentTopRouter } from './commentRoutes.js';

/** Root API router mounting every feature router. */
const router = Router();

/** Liveness/readiness probe: process uptime + MongoDB connection state. */
router.get('/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      db: states[mongoose.connection.readyState] ?? 'unknown',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/villages', villageRoutes); // also mounts nested attractions/events/comments
router.use('/attractions', attractionItemRouter); // /api/attractions/:id
router.use('/events', eventTopRouter); // /api/events + /api/events/:id
router.use('/comments', commentTopRouter); // /api/comments/*
router.use('/municipalities', municipalityRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/officer-requests', officerRequestRoutes);
router.use('/stats', statsRoutes);

export default router;
