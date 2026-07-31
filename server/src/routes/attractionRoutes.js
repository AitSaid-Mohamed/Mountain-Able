import { Router } from 'express';
import {
  listVillageAttractions,
  createAttraction,
  updateAttraction,
  deleteAttraction,
} from '../controllers/attractionController.js';
import { protect, restrictTo, requireActive } from '../middleware/auth.js';
import { ownsVillage, ownsResource } from '../middleware/ownsVillage.js';
import { validate } from '../middleware/validate.js';
import {
  createAttractionRules,
  updateAttractionRules,
} from '../middleware/validators/attractionValidators.js';
import Attraction from '../models/Attraction.js';

/** Nested under /api/villages/:villageId/attractions (mergeParams for villageId). */
export const attractionNestedRouter = Router({ mergeParams: true });

attractionNestedRouter.get('/', listVillageAttractions);
attractionNestedRouter.post(
  '/',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsVillage,
  createAttractionRules,
  validate,
  createAttraction
);

/** Top-level /api/attractions/:id for item updates and deletes. */
export const attractionItemRouter = Router();

attractionItemRouter.patch(
  '/:id',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsResource(Attraction, 'Attraction'),
  updateAttractionRules,
  validate,
  updateAttraction
);
attractionItemRouter.delete(
  '/:id',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsResource(Attraction, 'Attraction'),
  deleteAttraction
);
