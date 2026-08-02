import mongoose from 'mongoose';
import VisitedVillage from '../models/VisitedVillage.js';
import Favorite from '../models/Favorite.js';
import SavedRoute from '../models/SavedRoute.js';
import Village from '../models/Village.js';
import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Fields of a village needed to render cards, timelines and the map. */
const VILLAGE_FIELDS =
  'name slug region province coverImage images ratingAverage ratingCount shortDescription location';

// --- Visited villages ------------------------------------------------------

/** GET /api/me/visited — the caller's declared visits, newest first. */
export const listVisited = catchAsync(async (req, res) => {
  const visited = await VisitedVillage.find({ userId: req.user._id })
    .sort('-visitedAt')
    .populate('villageId', VILLAGE_FIELDS);
  sendSuccess(res, visited);
});

/**
 * POST /api/me/visited — declare a visit. Self-reported only; the platform
 * never detects visits. Body: { villageId, visitedAt?, note? }.
 */
export const addVisited = catchAsync(async (req, res, next) => {
  const { villageId, visitedAt, note } = req.body;
  if (!(await Village.exists({ _id: villageId }))) {
    return next(new AppError('Village not found.', 404));
  }
  const existing = await VisitedVillage.findOne({ userId: req.user._id, villageId });
  if (existing) return next(new AppError('You have already marked this village as visited.', 409));

  const record = await VisitedVillage.create({
    userId: req.user._id,
    villageId,
    ...(visitedAt && { visitedAt }),
    ...(note !== undefined && { note }),
  });
  await record.populate('villageId', VILLAGE_FIELDS);
  sendSuccess(res, record, undefined, 201);
});

/** PATCH /api/me/visited/:id — edit the date or note of one's own visit. */
export const updateVisited = catchAsync(async (req, res, next) => {
  const updates = {};
  if (req.body.visitedAt !== undefined) updates.visitedAt = req.body.visitedAt;
  if (req.body.note !== undefined) updates.note = req.body.note;

  // Scope to the owner: never touch another user's record.
  const record = await VisitedVillage.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('villageId', VILLAGE_FIELDS);
  if (!record) return next(new AppError('Visit record not found.', 404));
  sendSuccess(res, record);
});

/** DELETE /api/me/visited/:id — remove one's own visit declaration. */
export const removeVisited = catchAsync(async (req, res, next) => {
  const record = await VisitedVillage.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!record) return next(new AppError('Visit record not found.', 404));
  sendSuccess(res, { deleted: true, id: record._id });
});

// --- Favorites -------------------------------------------------------------

/** GET /api/me/favorites — the caller's saved villages, newest first. */
export const listFavorites = catchAsync(async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user._id })
    .sort('-createdAt')
    .populate('villageId', VILLAGE_FIELDS);
  sendSuccess(res, favorites);
});

/** POST /api/me/favorites — save a village. Body: { villageId }. */
export const addFavorite = catchAsync(async (req, res, next) => {
  const { villageId } = req.body;
  if (!(await Village.exists({ _id: villageId }))) {
    return next(new AppError('Village not found.', 404));
  }
  const existing = await Favorite.findOne({ userId: req.user._id, villageId });
  if (existing) return next(new AppError('This village is already in your favourites.', 409));

  const record = await Favorite.create({ userId: req.user._id, villageId });
  await record.populate('villageId', VILLAGE_FIELDS);
  sendSuccess(res, record, undefined, 201);
});

/** DELETE /api/me/favorites/:id — remove one's own favourite. */
export const removeFavorite = catchAsync(async (req, res, next) => {
  const record = await Favorite.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!record) return next(new AppError('Favourite not found.', 404));
  sendSuccess(res, { deleted: true, id: record._id });
});

// --- Saved routes ----------------------------------------------------------

/** GET /api/me/routes — the caller's saved routes, newest first. */
export const listRoutes = catchAsync(async (req, res) => {
  const routes = await SavedRoute.find({ userId: req.user._id })
    .sort('-createdAt')
    .populate('villageId', 'name slug region coverImage');
  sendSuccess(res, routes);
});

/**
 * POST /api/me/routes — save a planned route.
 * Body: { villageId, startLabel?, startLocation, profile, distance?, duration?, geometry? }
 */
export const addRoute = catchAsync(async (req, res, next) => {
  const { villageId, startLabel, startLocation, profile, distance, duration, geometry } = req.body;
  if (!(await Village.exists({ _id: villageId }))) return next(new AppError('Village not found.', 404));
  if (!startLocation || !Number.isFinite(startLocation.lat) || !Number.isFinite(startLocation.lng)) {
    return next(new AppError('A valid start location is required.', 422, { startLocation: 'Required.' }));
  }
  const route = await SavedRoute.create({
    userId: req.user._id, villageId, startLabel, startLocation, profile, distance, duration, geometry,
  });
  await route.populate('villageId', 'name slug region coverImage');
  sendSuccess(res, route, undefined, 201);
});

/** DELETE /api/me/routes/:id — remove one's own saved route. */
export const removeRoute = catchAsync(async (req, res, next) => {
  const route = await SavedRoute.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!route) return next(new AppError('Saved route not found.', 404));
  sendSuccess(res, { deleted: true, id: route._id });
});

// --- Aggregated personal stats --------------------------------------------

/**
 * GET /api/me/stats — the caller's own aggregate figures, computed with
 * aggregation pipelines. Strictly scoped to `req.user`; one tourist's records
 * are never exposed to another.
 */
export const myStats = catchAsync(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user._id);

  const [visitedAgg, favoritesCount, reviewAgg, recent] = await Promise.all([
    VisitedVillage.aggregate([
      { $match: { userId: uid } },
      { $lookup: { from: 'villages', localField: 'villageId', foreignField: '_id', as: 'v' } },
      { $unwind: { path: '$v', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, count: { $sum: 1 }, regions: { $addToSet: '$v.region' } } },
    ]),
    Favorite.countDocuments({ userId: uid }),
    Comment.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
    ]),
    VisitedVillage.findOne({ userId: uid }).sort('-visitedAt').populate('villageId', 'name slug region'),
  ]);

  const regionsVisited = (visitedAgg[0]?.regions ?? []).filter(Boolean).sort();

  sendSuccess(res, {
    villagesVisited: visitedAgg[0]?.count ?? 0,
    villagesFavorited: favoritesCount,
    reviewsWritten: reviewAgg[0]?.count ?? 0,
    averageRatingGiven: reviewAgg[0] ? Math.round(reviewAgg[0].avg * 10) / 10 : 0,
    distinctRegionsVisited: regionsVisited.length,
    regionsVisited,
    mostRecentVisit: recent
      ? { visitedAt: recent.visitedAt, village: recent.villageId }
      : null,
  });
});
