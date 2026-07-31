import Village from '../models/Village.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * `ownsVillage` — village ownership guard for officers.
 *
 * Ensures an `officer` can only act on a village that belongs to their own
 * `municipalityId`. Admins bypass the check (full access). This is the single
 * place where the "an officer must never modify a village outside their
 * municipality" rule is enforced, so controllers never repeat it.
 *
 * Expects the village id in `req.params.villageId` or `req.params.id`, and
 * attaches the loaded village to `req.village` for downstream handlers.
 */
export const ownsVillage = catchAsync(async (req, _res, next) => {
  const villageId = req.params.villageId ?? req.params.id;
  const village = await Village.findById(villageId);

  if (!village) {
    return next(new AppError('Village not found.', 404));
  }

  // Admins have unrestricted access.
  if (req.user.role === 'admin') {
    req.village = village;
    return next();
  }

  // Officers may only manage villages of their own municipality.
  if (
    req.user.role === 'officer' &&
    req.user.municipalityId &&
    village.municipalityId.equals(req.user.municipalityId)
  ) {
    req.village = village;
    return next();
  }

  return next(new AppError('You can only manage villages of your own municipality.', 403));
});

/**
 * `ownsResource(Model, resourceName)` — ownership guard for entities that
 * belong to a village (attractions, events). Loads the resource by
 * `req.params.id`, resolves its parent village and applies the same rule as
 * `ownsVillage`: admins pass; officers pass only for their own municipality.
 * The loaded documents are attached to `req.resource` and `req.village`.
 *
 * @param {import('mongoose').Model} Model  the resource model
 * @param {string} resourceName  human-readable name for error messages
 * @returns {import('express').RequestHandler}
 */
export const ownsResource = (Model, resourceName) =>
  catchAsync(async (req, _res, next) => {
    const resource = await Model.findById(req.params.id);
    if (!resource) {
      return next(new AppError(`${resourceName} not found.`, 404));
    }

    const village = await Village.findById(resource.villageId);
    if (!village) {
      return next(new AppError('Parent village not found.', 404));
    }

    if (
      req.user.role === 'admin' ||
      (req.user.role === 'officer' &&
        req.user.municipalityId &&
        village.municipalityId.equals(req.user.municipalityId))
    ) {
      req.resource = resource;
      req.village = village;
      return next();
    }

    return next(
      new AppError(`You can only manage ${resourceName.toLowerCase()}s of your own municipality.`, 403)
    );
  });
