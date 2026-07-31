import Village from '../models/Village.js';
import Municipality from '../models/Municipality.js';
import Attraction from '../models/Attraction.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/stats/overview — platform-wide totals and the average rating.
 * Counts are DB-side counts; the average rating is computed with an
 * aggregation over approved comments (never reduced in JavaScript).
 */
export const overview = catchAsync(async (_req, res) => {
  const [villages, municipalities, attractions, events, tourists, comments, ratingAgg] =
    await Promise.all([
      Village.countDocuments(),
      Municipality.countDocuments(),
      Attraction.countDocuments(),
      Event.countDocuments(),
      User.countDocuments({ role: 'tourist' }),
      Comment.countDocuments(),
      Comment.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

  const averageRating = ratingAgg[0] ? Math.round(ratingAgg[0].avg * 100) / 100 : 0;

  sendSuccess(res, {
    villages,
    municipalities,
    attractions,
    events,
    tourists,
    comments,
    approvedComments: ratingAgg[0]?.count ?? 0,
    averageRating,
  });
});

/**
 * GET /api/stats/regions — per-region aggregates (village count, average
 * rating, total comments, total attractions) using a single pipeline with
 * lookups over attractions and comments.
 */
export const byRegion = catchAsync(async (_req, res) => {
  const rows = await Village.aggregate([
    {
      $lookup: { from: 'attractions', localField: '_id', foreignField: 'villageId', as: 'attractions' },
    },
    {
      $lookup: { from: 'comments', localField: '_id', foreignField: 'villageId', as: 'comments' },
    },
    {
      $group: {
        _id: '$region',
        villageCount: { $sum: 1 },
        avgRating: { $avg: '$ratingAverage' },
        totalAttractions: { $sum: { $size: '$attractions' } },
        totalComments: { $sum: { $size: '$comments' } },
      },
    },
    {
      $project: {
        _id: 0,
        region: '$_id',
        villageCount: 1,
        avgRating: { $round: ['$avgRating', 2] },
        totalAttractions: 1,
        totalComments: 1,
      },
    },
    { $sort: { region: 1 } },
  ]);

  sendSuccess(res, rows);
});

/**
 * GET /api/stats/villages/top — top 10 villages by rating (min 3 ratings).
 * Optional `?region=` filter.
 */
export const topVillages = catchAsync(async (req, res) => {
  const match = { ratingCount: { $gte: 3 } };
  if (req.query.region) match.region = req.query.region;

  const rows = await Village.aggregate([
    { $match: match },
    { $sort: { ratingAverage: -1, ratingCount: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        slug: 1,
        region: 1,
        province: 1,
        ratingAverage: 1,
        ratingCount: 1,
        coverImage: 1,
      },
    },
  ]);

  sendSuccess(res, rows);
});

/**
 * GET /api/stats/satisfaction — platform-wide rating distribution (1–5) plus a
 * 12-month time series of comment count and average rating.
 */
export const satisfaction = catchAsync(async (_req, res) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [distributionRaw, series] = await Promise.all([
    Comment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Comment.aggregate([
      { $match: { status: 'approved', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          avgRating: { $round: ['$avgRating', 2] },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]),
  ]);

  // Fill any missing star buckets (1–5) with zero for a complete distribution.
  const byRating = Object.fromEntries(distributionRaw.map((d) => [d._id, d.count]));
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: byRating[rating] ?? 0 }));

  sendSuccess(res, { distribution, monthly: series });
});
