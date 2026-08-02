import { Router } from 'express';
import {
  listVisited, addVisited, updateVisited, removeVisited,
  listFavorites, addFavorite, removeFavorite,
  listRoutes, addRoute, removeRoute,
  myStats,
} from '../controllers/meController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addVisitedRules, updateVisitedRules, addFavoriteRules } from '../middleware/validators/meValidators.js';

/**
 * Personal, self-declared tourist data under /api/me. Every route is scoped to
 * the authenticated tourist's own records — one user's data is never exposed to
 * another. Visits and favourites are self-reported; nothing is auto-detected.
 */
const router = Router();

router.use(protect, restrictTo('tourist'));

router.get('/stats', myStats);

router.get('/visited', listVisited);
router.post('/visited', addVisitedRules, validate, addVisited);
router.patch('/visited/:id', updateVisitedRules, validate, updateVisited);
router.delete('/visited/:id', removeVisited);

router.get('/favorites', listFavorites);
router.post('/favorites', addFavoriteRules, validate, addFavorite);
router.delete('/favorites/:id', removeFavorite);

router.get('/routes', listRoutes);
router.post('/routes', addRoute);
router.delete('/routes/:id', removeRoute);

export default router;
