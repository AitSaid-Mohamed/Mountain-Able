import { Router } from 'express';
import { overview, byRegion, topVillages, satisfaction } from '../controllers/statsController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// All statistics are restricted to regional authorities and admins.
router.use(protect, restrictTo('authority', 'admin'));

router.get('/overview', overview);
router.get('/regions', byRegion);
router.get('/villages/top', topVillages);
router.get('/satisfaction', satisfaction);

export default router;
