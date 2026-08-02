import Attraction from '../models/Attraction.js';
import Category from '../models/Category.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { pick } from '../utils/pick.js';

/**
 * GET /api/villages/:villageId/attractions — public list for a village.
 * Supports `?category=` (slug or id) filtering.
 */
export const listVillageAttractions = catchAsync(async (req, res) => {
  const filter = { villageId: req.params.villageId };

  if (req.query.category) {
    const cat = req.query.category;
    const catDoc = await Category.findOne(
      /^[0-9a-fA-F]{24}$/.test(cat) ? { _id: cat } : { slug: cat }
    );
    filter.categoryId = catDoc ? catDoc._id : null;
  }

  const attractions = await Attraction.find(filter).populate('categoryId', 'name slug icon');
  sendSuccess(res, attractions);
});

/**
 * POST /api/villages/:villageId/attractions — create (officer/own, admin).
 * `req.village` is provided by the `ownsVillage` middleware.
 */
export const createAttraction = catchAsync(async (req, res) => {
  const payload = pick(req.body, ['name', 'description', 'categoryId', 'images', 'location']);
  payload.villageId = req.village._id; // ownership-scoped, never client-set
  const attraction = await Attraction.create(payload);
  sendSuccess(res, attraction, undefined, 201);
});

/** PATCH /api/attractions/:id — update (ownership via `ownsResource`). */
export const updateAttraction = catchAsync(async (req, res) => {
  // Allow-list: villageId is not settable, so an attraction cannot be reparented.
  const updates = pick(req.body, ['name', 'description', 'categoryId', 'images', 'location']);
  const attraction = await Attraction.findByIdAndUpdate(req.resource._id, updates, {
    new: true,
    runValidators: true,
  }).populate('categoryId', 'name slug icon');
  sendSuccess(res, attraction);
});

/** DELETE /api/attractions/:id — delete (ownership via `ownsResource`). */
export const deleteAttraction = catchAsync(async (req, res) => {
  await Attraction.findByIdAndDelete(req.resource._id);
  sendSuccess(res, { deleted: true, id: req.resource._id });
});
