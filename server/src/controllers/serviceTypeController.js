import ServiceType from '../models/ServiceType.js';
import MunicipalityCapability from '../models/MunicipalityCapability.js';
import CoordinationRequest from '../models/CoordinationRequest.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { pick } from '../utils/pick.js';
import { generateUniqueSlug } from '../utils/slug.js';

const FIELDS = ['name', 'description', 'icon', 'group', 'sortOrder', 'isActive'];

/** GET /api/service-types — public. The taxonomy, in display order. */
export const listServiceTypes = catchAsync(async (req, res) => {
  const filter = {};
  // Retired types stay readable so historical requests still resolve their name.
  if (req.query.includeInactive !== 'true') filter.isActive = true;
  const types = await ServiceType.find(filter).sort({ group: 1, sortOrder: 1, name: 1 });
  sendSuccess(res, types);
});

/** POST /api/service-types — admin. */
export const createServiceType = catchAsync(async (req, res) => {
  const payload = pick(req.body, FIELDS);
  payload.slug = req.body.slug || (await generateUniqueSlug(ServiceType, req.body.name));
  const type = await ServiceType.create(payload);
  sendSuccess(res, type, undefined, 201);
});

/** PATCH /api/service-types/:id — admin. */
export const updateServiceType = catchAsync(async (req, res, next) => {
  const type = await ServiceType.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS), {
    new: true,
    runValidators: true,
  });
  if (!type) return next(new AppError('Service type not found.', 404));
  sendSuccess(res, type);
});

/**
 * DELETE /api/service-types/:id — admin, refused while in use.
 *
 * Deleting a type that municipalities have declared or requests have referenced
 * would orphan those records and destroy the historical series the authority
 * analytics are built on. Retire it instead (`isActive: false`), which keeps the
 * record intact while removing it from the declaration screens.
 */
export const deleteServiceType = catchAsync(async (req, res, next) => {
  const [capabilities, requests] = await Promise.all([
    MunicipalityCapability.countDocuments({ serviceTypeId: req.params.id }),
    CoordinationRequest.countDocuments({ serviceTypeId: req.params.id }),
  ]);
  if (capabilities > 0 || requests > 0) {
    return next(
      new AppError(
        `Cannot delete: ${capabilities} declaration(s) and ${requests} request(s) reference this service type. Retire it instead.`,
        409
      )
    );
  }
  const type = await ServiceType.findByIdAndDelete(req.params.id);
  if (!type) return next(new AppError('Service type not found.', 404));
  sendSuccess(res, { deleted: true, id: type._id });
});
