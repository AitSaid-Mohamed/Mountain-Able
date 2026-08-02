import { Router } from 'express';
import { plan, corridor, geocode } from '../controllers/routeController.js';
import { routesLimiter } from '../middleware/rateLimit.js';

/**
 * Route-planning endpoints. Public (no auth) but rate-limited more strictly
 * than general reads, because each request may call third-party services.
 * The limiter is skipped under NODE_ENV=test so automated checks aren't
 * throttled.
 */
const router = Router();

if (process.env.NODE_ENV !== 'test') router.use(routesLimiter);

router.post('/plan', plan);
router.get('/corridor', corridor);
router.get('/geocode', geocode);

export default router;
