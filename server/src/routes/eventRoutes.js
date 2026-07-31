import { Router } from 'express';
import {
  listEvents,
  listVillageEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect, restrictTo, requireActive } from '../middleware/auth.js';
import { ownsVillage, ownsResource } from '../middleware/ownsVillage.js';
import { validate } from '../middleware/validate.js';
import { createEventRules, updateEventRules } from '../middleware/validators/eventValidators.js';
import Event from '../models/Event.js';

/** Top-level /api/events — global list plus item update/delete. */
export const eventTopRouter = Router();

eventTopRouter.get('/', listEvents);
eventTopRouter.patch(
  '/:id',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsResource(Event, 'Event'),
  updateEventRules,
  validate,
  updateEvent
);
eventTopRouter.delete(
  '/:id',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsResource(Event, 'Event'),
  deleteEvent
);

/** Nested under /api/villages/:villageId/events. */
export const eventNestedRouter = Router({ mergeParams: true });

eventNestedRouter.get('/', listVillageEvents);
eventNestedRouter.post(
  '/',
  protect,
  restrictTo('officer', 'admin'),
  requireActive,
  ownsVillage,
  createEventRules,
  validate,
  createEvent
);
