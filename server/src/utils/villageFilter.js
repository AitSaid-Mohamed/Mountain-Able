import Attraction from '../models/Attraction.js';
import Category from '../models/Category.js';

/**
 * Build the Mongo filter for a public village query from the request.
 *
 * Shared by `GET /api/villages` (the paginated grid) and `GET /api/villages/map`
 * (the marker layer) so the two can never drift: the map is meant to show
 * exactly the set the grid is drawn from, and duplicating this logic is how
 * that guarantee gets lost. Sorting and pagination are deliberately *not*
 * handled here — the map wants neither.
 *
 * @param {import('express').Request} req  read for `query` and `user`
 * @returns {Promise<object>} a Mongo filter object
 */
export async function buildVillageFilter(req) {
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

  return filter;
}

export default buildVillageFilter;
