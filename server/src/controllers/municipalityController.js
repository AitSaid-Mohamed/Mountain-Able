import Municipality from '../models/Municipality.js';
import Village from '../models/Village.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** GET /api/municipalities — public list. */
export const listMunicipalities = catchAsync(async (_req, res) => {
  const municipalities = await Municipality.find().sort('name');
  sendSuccess(res, municipalities);
});

/** GET /api/municipalities/:id — public; includes its villages. */
export const getMunicipality = catchAsync(async (req, res, next) => {
  const municipality = await Municipality.findById(req.params.id);
  if (!municipality) return next(new AppError('Municipality not found.', 404));
  const villages = await Village.find({ municipalityId: municipality._id }).select(
    'name slug region province ratingAverage coverImage isPublished'
  );
  sendSuccess(res, { ...municipality.toJSON(), villages });
});

/** POST /api/municipalities — admin. */
export const createMunicipality = catchAsync(async (req, res) => {
  const municipality = await Municipality.create(req.body);
  sendSuccess(res, municipality, undefined, 201);
});

/** PATCH /api/municipalities/:id — admin. */
export const updateMunicipality = catchAsync(async (req, res, next) => {
  const municipality = await Municipality.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!municipality) return next(new AppError('Municipality not found.', 404));
  sendSuccess(res, municipality);
});

/**
 * DELETE /api/municipalities/:id — admin.
 * Refused with 409 if villages still reference the municipality.
 */
export const deleteMunicipality = catchAsync(async (req, res, next) => {
  const villageCount = await Village.countDocuments({ municipalityId: req.params.id });
  if (villageCount > 0) {
    return next(
      new AppError(`Cannot delete: ${villageCount} village(s) still belong to this municipality.`, 409)
    );
  }
  const municipality = await Municipality.findByIdAndDelete(req.params.id);
  if (!municipality) return next(new AppError('Municipality not found.', 404));
  sendSuccess(res, { deleted: true, id: municipality._id });
});
