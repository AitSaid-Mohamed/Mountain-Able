import Village, { toGeoPoint } from '../models/Village.js';
import Attraction from '../models/Attraction.js';
import Event from '../models/Event.js';
import Comment from '../models/Comment.js';
import Category from '../models/Category.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildMeta } from '../utils/pagination.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { pick } from '../utils/pick.js';
import APIFeatures from '../utils/APIFeatures.js';

/** Public `sort` value → Mongo sort string. */
const SORT_MAP = {
  rating: 'ratingAverage',
  '-rating': '-ratingAverage',
  name: 'name',
  '-name': '-name',
  newest: '-createdAt',
};

/**
 * GET /api/villages — list with search, filter, sort, pagination.
 * Public callers only see published villages; an admin or the owning officer
 * may pass `includeUnpublished=true` to also receive unpublished ones.
 */
export const listVillages = catchAsync(async (req, res) => {
  const { search, region, province, minRating, category, includeUnpublished } = req.query;
  const filter = {};

  // Visibility: published-only unless an authorised user opts in.
  const wantsUnpublished = includeUnpublished === 'true';
  if (wantsUnpublished && req.user?.role === 'admin') {
    // no isPublished constraint
  } else if (wantsUnpublished && req.user?.role === 'officer' && req.user.municipalityId) {
    filter.$or = [{ isPublished: true }, { municipalityId: req.user.municipalityId }];
  } else {
    filter.isPublished = true;
  }

  if (search) {
    const rx = new RegExp(search, 'i');
    // Combine with any existing $or (visibility) via $and to keep both.
    const searchOr = [{ name: rx }, { description: rx }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }
  if (region) filter.region = region;
  if (province) filter.province = province;
  if (minRating) filter.ratingAverage = { $gte: Number(minRating) };

  // `category` → villages that have at least one attraction in that category.
  if (category) {
    const catDoc = await Category.findOne(
      /^[0-9a-fA-F]{24}$/.test(category) ? { _id: category } : { slug: category }
    );
    const villageIds = catDoc
      ? await Attraction.find({ categoryId: catDoc._id }).distinct('villageId')
      : [];
    filter._id = { $in: villageIds };
  }

  const total = await Village.countDocuments(filter);
  const features = new APIFeatures(Village.find(), req.query)
    .filter(filter)
    .sort(SORT_MAP, '-rating')
    .paginate({ defaultLimit: 9, maxLimit: 50 });

  const villages = await features.query.populate('municipalityId', 'name region province');
  sendSuccess(res, villages, buildMeta(total, features.page, features.limit));
});

/**
 * GET /api/villages/map — lightweight payload for the Leaflet map.
 * Never returns descriptions or full image arrays.
 */
export const villagesForMap = catchAsync(async (_req, res) => {
  const villages = await Village.find({ isPublished: true }).select(
    '_id name slug location ratingAverage coverImage'
  );
  sendSuccess(res, villages);
});

/**
 * GET /api/villages/:slug — full detail with municipality, attractions
 * (incl. category), upcoming events and the 10 most recent approved comments.
 */
export const getVillageBySlug = catchAsync(async (req, res, next) => {
  const village = await Village.findOne({ slug: req.params.slug }).populate(
    'municipalityId',
    'name region province contactEmail phone'
  );
  if (!village) return next(new AppError('Village not found.', 404));

  // Unpublished villages are visible only to admins and the owning officer.
  const isOwner =
    req.user &&
    (req.user.role === 'admin' ||
      (req.user.role === 'officer' &&
        req.user.municipalityId &&
        village.municipalityId?._id &&
        village.municipalityId._id.equals(req.user.municipalityId)));
  if (!village.isPublished && !isOwner) {
    return next(new AppError('Village not found.', 404));
  }

  const [attractions, events, comments] = await Promise.all([
    Attraction.find({ villageId: village._id }).populate('categoryId', 'name slug icon'),
    Event.find({ villageId: village._id, endDate: { $gte: new Date() } }).sort('startDate'),
    Comment.find({ villageId: village._id, status: 'approved' })
      .sort('-createdAt')
      .limit(10)
      .populate('userId', 'firstName lastName avatar'),
  ]);

  sendSuccess(res, { ...village.toJSON(), attractions, events, comments });
});

/**
 * POST /api/villages — create a village (officer for own municipality, admin).
 * Officers always create within their own municipality regardless of body.
 */
export const createVillage = catchAsync(async (req, res, next) => {
  // Explicit allow-list: a client can never set isPublished, ratingAverage or
  // ratingCount — publication is admin-only and ratings are derived from
  // approved comments.
  const payload = pick(req.body, [
    'name', 'description', 'shortDescription', 'region', 'province',
    'location', 'altitude', 'population', 'images', 'coverImage', 'stats',
  ]);

  if (req.user.role === 'officer') {
    payload.municipalityId = req.user.municipalityId;
  } else if (req.body.municipalityId) {
    payload.municipalityId = req.body.municipalityId;
  } else {
    return next(new AppError('municipalityId is required.', 422, { municipalityId: 'Required.' }));
  }

  payload.slug = await generateUniqueSlug(Village, payload.name);
  if (payload.location) payload.geo = toGeoPoint(payload.location);
  const village = await Village.create(payload);
  sendSuccess(res, village, undefined, 201);
});

/**
 * PATCH /api/villages/:id — update (ownership enforced by `ownsVillage`).
 * `req.village` is provided by the middleware.
 */
export const updateVillage = catchAsync(async (req, res) => {
  // Explicit allow-list: isPublished, ratingAverage and ratingCount are never
  // client-settable here (publish is admin-only; ratings are derived).
  const allowed = [
    'name', 'description', 'shortDescription', 'region', 'province',
    'location', 'altitude', 'population', 'images', 'coverImage', 'stats',
  ];
  // Only an admin may reassign a village's municipality.
  if (req.user.role === 'admin') allowed.push('municipalityId');
  const updates = pick(req.body, allowed);
  if (updates.name && updates.name !== req.village.name) {
    updates.slug = await generateUniqueSlug(Village, updates.name, req.village._id);
  }
  if (updates.location) updates.geo = toGeoPoint(updates.location);

  const village = await Village.findByIdAndUpdate(req.village._id, updates, {
    new: true,
    runValidators: true,
  });
  sendSuccess(res, village);
});

/**
 * DELETE /api/villages/:id — delete a village and its dependent documents
 * (attractions, events, comments) to keep the data consistent.
 */
export const deleteVillage = catchAsync(async (req, res) => {
  const id = req.village._id;
  await Promise.all([
    Attraction.deleteMany({ villageId: id }),
    Event.deleteMany({ villageId: id }),
    Comment.deleteMany({ villageId: id }),
  ]);
  await Village.findByIdAndDelete(id);
  sendSuccess(res, { deleted: true, id });
});

/** PATCH /api/villages/:id/publish — admin toggles publication state. */
export const togglePublish = catchAsync(async (req, res, next) => {
  const village = await Village.findByIdAndUpdate(
    req.params.id,
    { isPublished: req.body.isPublished },
    { new: true }
  );
  if (!village) return next(new AppError('Village not found.', 404));
  sendSuccess(res, village);
});

/** POST /api/villages/:id/images — upload one or more images (multipart). */
export const uploadVillageImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No image files were uploaded.', 400));
  }
  const paths = req.files.map((f) => `/uploads/${f.filename}`);
  const village = await Village.findByIdAndUpdate(
    req.village._id,
    { $push: { images: { $each: paths } }, ...(req.village.coverImage ? {} : { coverImage: paths[0] }) },
    { new: true }
  );
  sendSuccess(res, village, undefined, 201);
});

/** DELETE /api/villages/:id/images/:idx — remove an image by index. */
export const deleteVillageImage = catchAsync(async (req, res, next) => {
  const idx = Number(req.params.idx);
  const images = [...req.village.images];
  if (!Number.isInteger(idx) || idx < 0 || idx >= images.length) {
    return next(new AppError('Image index out of range.', 400));
  }
  const [removed] = images.splice(idx, 1);
  const updates = { images };
  if (req.village.coverImage === removed) updates.coverImage = images[0] ?? null;
  const village = await Village.findByIdAndUpdate(req.village._id, updates, { new: true });
  sendSuccess(res, village);
});
