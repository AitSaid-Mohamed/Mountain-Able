import { Router } from 'express';
import {
  listVillages,
  villagesForMap,
  getVillageBySlug,
  createVillage,
  updateVillage,
  deleteVillage,
  togglePublish,
  uploadVillageImages,
  deleteVillageImage,
} from '../controllers/villageController.js';
import { protect, restrictTo, requireActive, optionalAuth } from '../middleware/auth.js';
import { ownsVillage } from '../middleware/ownsVillage.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  createVillageRules,
  updateVillageRules,
  publishRules,
} from '../middleware/validators/villageValidators.js';
import { attractionNestedRouter } from './attractionRoutes.js';
import { eventNestedRouter } from './eventRoutes.js';
import { commentNestedRouter } from './commentRoutes.js';

const router = Router();

// --- Nested resources ------------------------------------------------------
router.use('/:villageId/attractions', attractionNestedRouter);
router.use('/:villageId/events', eventNestedRouter);
router.use('/:villageId/comments', commentNestedRouter);

// --- Collection ------------------------------------------------------------
router.get('/', optionalAuth, listVillages);
router.get('/map', villagesForMap);
router.post(
  '/',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  createVillageRules,
  validate,
  createVillage
);

// --- Item ------------------------------------------------------------------
// Detail by slug (optionalAuth so owners can preview unpublished villages).
router.get('/:slug', optionalAuth, getVillageBySlug);

router.patch(
  '/:id',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsVillage,
  updateVillageRules,
  validate,
  updateVillage
);
router.delete(
  '/:id',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsVillage,
  deleteVillage
);

// Publication toggle — admin only.
router.patch('/:id/publish', protect, restrictTo('admin'), publishRules, validate, togglePublish);

// Image management — officer (own) / admin.
router.post(
  '/:id/images',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsVillage,
  upload.array('images', 8),
  uploadVillageImages
);
router.delete(
  '/:id/images/:idx',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsVillage,
  deleteVillageImage
);

export default router;
