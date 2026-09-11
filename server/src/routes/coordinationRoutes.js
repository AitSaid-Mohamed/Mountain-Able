import { Router } from 'express';
import {
  listServiceTypes, createServiceType, updateServiceType, deleteServiceType,
} from '../controllers/serviceTypeController.js';
import {
  listCapabilities, listMyCapabilities, upsertCapability, updateCapability,
  confirmCapability, deleteCapability,
} from '../controllers/capabilityController.js';
import {
  previewCandidates, listRequests, getRequest, createRequest, closeRequest,
  respondToRequest, inboxSummary,
} from '../controllers/coordinationController.js';
import {
  coverageMatrix, demandByService, supplyGaps, engagement, isolation, coordinationOverview,
} from '../controllers/coordinationStatsController.js';
import { protect, restrictTo, requireActive } from '../middleware/auth.js';
import {
  ownsCapability, ownsRequest, canViewRequest, canRespondToRequest,
} from '../middleware/coordinationGuards.js';
import { validate } from '../middleware/validate.js';
import {
  createServiceTypeRules, updateServiceTypeRules, upsertCapabilityRules,
  updateCapabilityRules, createRequestRules, closeRequestRules, respondRules, candidateRules,
} from '../middleware/validators/coordinationValidators.js';

/** Admin-managed taxonomy: /api/service-types */
export const serviceTypeRouter = Router();
serviceTypeRouter.get('/', listServiceTypes);
serviceTypeRouter.post('/', protect, restrictTo('admin'), createServiceTypeRules, validate, createServiceType);
serviceTypeRouter.patch('/:id', protect, restrictTo('admin'), updateServiceTypeRules, validate, updateServiceType);
serviceTypeRouter.delete('/:id', protect, restrictTo('admin'), deleteServiceType);

/**
 * Declared capabilities: /api/capabilities
 *
 * Reading is public — the directory is the feature, and a neighbouring officer
 * must be able to see who has a minibus without first raising a request.
 * Declaring is scoped to the officer's own municipality.
 */
export const capabilityRouter = Router();
capabilityRouter.get('/', listCapabilities);
capabilityRouter.get('/mine', protect, restrictTo('officer', 'admin'), listMyCapabilities);
capabilityRouter.post(
  '/', protect, restrictTo('officer', 'admin'), requireActive,
  upsertCapabilityRules, validate, upsertCapability
);
capabilityRouter.patch(
  '/:id', protect, restrictTo('officer', 'admin'), requireActive, ownsCapability,
  updateCapabilityRules, validate, updateCapability
);
capabilityRouter.post(
  '/:id/confirm', protect, restrictTo('officer', 'admin'), requireActive, ownsCapability,
  confirmCapability
);
capabilityRouter.delete(
  '/:id', protect, restrictTo('officer', 'admin'), requireActive, ownsCapability, deleteCapability
);

/** Coordination requests and responses: /api/coordination */
export const coordinationRouter = Router();

// Everything here is between administrations; nothing is public.
coordinationRouter.use(protect);

// --- Statistics (authority + admin), before /requests/:id -------------------
const stats = Router();
stats.use(restrictTo('authority', 'admin'));
stats.get('/overview', coordinationOverview);
stats.get('/coverage', coverageMatrix);
stats.get('/demand', demandByService);
stats.get('/gaps', supplyGaps);
stats.get('/engagement', engagement);
stats.get('/isolation', isolation);
coordinationRouter.use('/stats', stats);

// --- Officer working surface ------------------------------------------------
coordinationRouter.get(
  '/candidates', restrictTo('officer', 'admin'), candidateRules, validate, previewCandidates
);
coordinationRouter.get('/inbox', restrictTo('officer', 'admin'), inboxSummary);

coordinationRouter.get('/requests', restrictTo('officer', 'admin', 'authority'), listRequests);
coordinationRouter.post(
  '/requests', restrictTo('officer', 'admin'), requireActive,
  createRequestRules, validate, createRequest
);
coordinationRouter.get('/requests/:id', canViewRequest, getRequest);
coordinationRouter.patch(
  '/requests/:id', restrictTo('officer', 'admin'), requireActive, ownsRequest,
  closeRequestRules, validate, closeRequest
);
coordinationRouter.post(
  '/requests/:id/responses', restrictTo('officer'), requireActive, canRespondToRequest,
  respondRules, validate, respondToRequest
);
