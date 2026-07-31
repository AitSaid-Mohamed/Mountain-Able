import Category from '../models/Category.js';
import Attraction from '../models/Attraction.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateUniqueSlug } from '../utils/slug.js';

/** GET /api/categories — public list. */
export const listCategories = catchAsync(async (_req, res) => {
  const categories = await Category.find().sort('name');
  sendSuccess(res, categories);
});

/** POST /api/categories — admin. */
export const createCategory = catchAsync(async (req, res) => {
  const slug = req.body.slug || (await generateUniqueSlug(Category, req.body.name));
  const category = await Category.create({ ...req.body, slug });
  sendSuccess(res, category, undefined, 201);
});

/** PATCH /api/categories/:id — admin. */
export const updateCategory = catchAsync(async (req, res, next) => {
  const updates = { ...req.body };
  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!category) return next(new AppError('Category not found.', 404));
  sendSuccess(res, category);
});

/**
 * DELETE /api/categories/:id — admin.
 * Refused with 409 if any attraction references the category.
 */
export const deleteCategory = catchAsync(async (req, res, next) => {
  const usage = await Attraction.countDocuments({ categoryId: req.params.id });
  if (usage > 0) {
    return next(new AppError(`Cannot delete: ${usage} attraction(s) use this category.`, 409));
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));
  sendSuccess(res, { deleted: true, id: category._id });
});
