import MunicipalityCapability, { STALE_AFTER_MS } from '../models/MunicipalityCapability.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { pick } from '../utils/pick.js';

const FIELDS = ['description', 'contactName', 'contactEmail', 'contactPhone', 'isActive'];

/** Mark declarations not confirmed within the stale window, for the owning officer. */
const withStaleFlag = (docs) => {
  const cutoff = Date.now() - STALE_AFTER_MS;
  return docs.map((d) => ({
    ...(d.toJSON ? d.toJSON() : d),
    isStale: d.reviewedAt ? new Date(d.reviewedAt).getTime() < cutoff : true,
  }));
};

/**
 * GET /api/capabilities — the declared services of one municipality.
 *
 * Public by design: the directory is the feature. A neighbouring officer must be
 * able to see what a comune offers without first raising a request, since often
 * all they want to know is who has a minibus.
 */
export const listCapabilities = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.municipalityId) filter.municipalityId = req.query.municipalityId;
  if (req.query.serviceTypeId) filter.serviceTypeId = req.query.serviceTypeId;
  if (req.query.includeInactive !== 'true') filter.isActive = true;

  const capabilities = await MunicipalityCapability.find(filter)
    .populate('serviceTypeId', 'name slug icon group description')
    .populate('municipalityId', 'name region province')
    .sort({ updatedAt: -1 });

  sendSuccess(res, withStaleFlag(capabilities));
});

/** GET /api/capabilities/mine — the caller's own municipality's declarations. */
export const listMyCapabilities = catchAsync(async (req, res, next) => {
  if (!req.user.municipalityId) {
    return next(new AppError('Your account is not linked to a municipality.', 400));
  }
  const capabilities = await MunicipalityCapability.find({
    municipalityId: req.user.municipalityId,
  })
    .populate('serviceTypeId', 'name slug icon group description')
    .sort({ updatedAt: -1 });

  sendSuccess(res, withStaleFlag(capabilities));
});

/**
 * POST /api/capabilities — declare a service for the caller's own municipality.
 *
 * `municipalityId` is taken from the authenticated officer and never from the
 * body, so a declaration can never be attributed to another comune. Re-declaring
 * an existing service updates it rather than failing on the unique index — the
 * screen is a set of toggles, and toggling one back on should restore it.
 */
export const upsertCapability = catchAsync(async (req, res, next) => {
  const municipalityId =
    req.user.role === 'admin' && req.body.municipalityId
      ? req.body.municipalityId
      : req.user.municipalityId;

  if (!municipalityId) {
    return next(new AppError('Your account is not linked to a municipality.', 400));
  }

  const payload = pick(req.body, FIELDS);
  payload.declaredBy = req.user._id;
  payload.reviewedAt = new Date();

  const capability = await MunicipalityCapability.findOneAndUpdate(
    { municipalityId, serviceTypeId: req.body.serviceTypeId },
    { $set: payload, $setOnInsert: { municipalityId, serviceTypeId: req.body.serviceTypeId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('serviceTypeId', 'name slug icon group description');

  sendSuccess(res, capability, undefined, 201);
});

/** PATCH /api/capabilities/:id — amend a declaration (`ownsCapability`). */
export const updateCapability = catchAsync(async (req, res) => {
  const updates = pick(req.body, FIELDS);
  updates.reviewedAt = new Date();

  const capability = await MunicipalityCapability.findByIdAndUpdate(
    req.capability._id,
    updates,
    { new: true, runValidators: true }
  ).populate('serviceTypeId', 'name slug icon group description');

  sendSuccess(res, capability);
});

/**
 * POST /api/capabilities/:id/confirm — "still true".
 *
 * Separate from a general update because confirming is the common action and
 * should not require resubmitting the whole declaration. It is what keeps the
 * stale flag meaningful: a directory whose entries are never reconfirmed is a
 * directory nobody can trust.
 */
export const confirmCapability = catchAsync(async (req, res) => {
  const capability = await MunicipalityCapability.findByIdAndUpdate(
    req.capability._id,
    { reviewedAt: new Date(), declaredBy: req.user._id },
    { new: true }
  ).populate('serviceTypeId', 'name slug icon group description');
  sendSuccess(res, capability);
});

/** DELETE /api/capabilities/:id — withdraw a declaration (`ownsCapability`). */
export const deleteCapability = catchAsync(async (req, res) => {
  await MunicipalityCapability.findByIdAndDelete(req.capability._id);
  sendSuccess(res, { deleted: true, id: req.capability._id });
});
