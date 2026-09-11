import mongoose from 'mongoose';
import CoordinationRequest from '../models/CoordinationRequest.js';
import CoordinationResponse from '../models/CoordinationResponse.js';
import MunicipalityCapability from '../models/MunicipalityCapability.js';
import Municipality from '../models/Municipality.js';
import ServiceType from '../models/ServiceType.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { EXPIRED_AWARE_STATUS } from '../utils/coordinationStatus.js';
import { municipalityAnchors, haversineKm } from '../utils/municipalityAnchor.js';

/**
 * Territorial evidence from the accumulated coordination record.
 *
 * Every request permanently records what was sought, where, and whether it was
 * met. No single municipality can produce that picture — it exists only because
 * requests pool across the territory, which is what makes this feature more than
 * a message board.
 *
 * All figures come from aggregation pipelines, and all of them apply the expiry
 * cutoff at query time via `EXPIRED_AWARE_STATUS`: a request that lapsed but has
 * not been read since is still `open` in the database, and counting it as such
 * would overstate live demand.
 *
 * **On small numbers.** Every endpoint returns absolute counts beside every rate,
 * and `MIN_N` marks where a rate is computed from too few requests to mean
 * anything. A fulfilment rate of "0%" from a single request is a lie told with a
 * true number, and the platform's rule against inventing data to fill a UI applies
 * to statistics as much as to village stat strips.
 */
export const MIN_N = 5;

/** Attach the requesting municipality's region to each request. */
const withRegion = [
  {
    $lookup: {
      from: 'municipalities',
      localField: 'municipalityId',
      foreignField: '_id',
      as: 'muni',
    },
  },
  { $unwind: '$muni' },
];

/**
 * GET /api/coordination/stats/coverage — service type × region declaration counts.
 *
 * Shows structural gaps before anybody has asked for anything: "no municipality
 * in Basilicata declares first-aid presence."
 */
export const coverageMatrix = catchAsync(async (_req, res) => {
  const [types, regions, rows] = await Promise.all([
    ServiceType.find({ isActive: true }).sort({ group: 1, sortOrder: 1 }).lean(),
    Municipality.distinct('region'),
    MunicipalityCapability.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'municipalities',
          localField: 'municipalityId',
          foreignField: '_id',
          as: 'muni',
        },
      },
      { $unwind: '$muni' },
      {
        $group: {
          _id: { region: '$muni.region', serviceTypeId: '$serviceTypeId' },
          municipalities: { $addToSet: '$municipalityId' },
        },
      },
      {
        $project: {
          _id: 0,
          region: '$_id.region',
          serviceTypeId: '$_id.serviceTypeId',
          count: { $size: '$municipalities' },
        },
      },
    ]),
  ]);

  // Municipality count per region, so a zero can be read as "none of the four"
  // rather than as an unknown.
  const totals = await Municipality.aggregate([
    { $group: { _id: '$region', municipalities: { $sum: 1 } } },
    { $project: { _id: 0, region: '$_id', municipalities: 1 } },
  ]);

  sendSuccess(res, {
    serviceTypes: types.map((t) => ({
      _id: t._id, name: t.name, slug: t.slug, icon: t.icon, group: t.group,
    })),
    regions: regions.sort(),
    municipalitiesByRegion: totals,
    cells: rows,
  });
});

/**
 * GET /api/coordination/stats/demand — what was sought, and whether it was met.
 *
 * The headline table. Demand that went unanswered is far stronger evidence for
 * investment than demand that was satisfied, so the ranking is by unmet count.
 *
 * `unmet` and `expired` are both counted as not met but reported separately:
 * "we were told no" and "nobody replied at all" call for different responses.
 */
export const demandByService = catchAsync(async (_req, res) => {
  const now = new Date();
  const rows = await CoordinationRequest.aggregate([
    ...withRegion,
    { $addFields: { effectiveStatus: EXPIRED_AWARE_STATUS(now) } },
    {
      $group: {
        _id: { serviceTypeId: '$serviceTypeId', region: '$muni.region' },
        total: { $sum: 1 },
        fulfilled: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'fulfilled'] }, 1, 0] } },
        unmet: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'unmet'] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'expired'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'cancelled'] }, 1, 0] } },
        open: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'open'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'servicetypes',
        localField: '_id.serviceTypeId',
        foreignField: '_id',
        as: 'type',
      },
    },
    { $unwind: '$type' },
    {
      $project: {
        _id: 0,
        region: '$_id.region',
        serviceType: { _id: '$type._id', name: '$type.name', slug: '$type.slug', icon: '$type.icon' },
        total: 1, fulfilled: 1, unmet: 1, expired: 1, cancelled: 1, open: 1,
        notMet: { $add: ['$unmet', '$expired'] },
        // Cancelled requests are excluded from the denominator: a withdrawn need
        // is not evidence of missing capability, and counting it as unmet would
        // corrupt exactly the signal this table exists to produce.
        decided: { $add: ['$fulfilled', '$unmet', '$expired'] },
      },
    },
    {
      $addFields: {
        fulfilmentRate: {
          $cond: [
            { $gte: ['$decided', MIN_N] },
            { $round: [{ $multiply: [{ $divide: ['$fulfilled', '$decided'] }, 100] }, 0] },
            null, // below MIN_N the rate is withheld, not rounded to a lie
          ],
        },
      },
    },
    { $sort: { notMet: -1, total: -1 } },
  ]);

  sendSuccess(res, rows, { minN: MIN_N });
});

/**
 * GET /api/coordination/stats/gaps — demand against declared supply.
 *
 * The investment-priority list, and the most useful single output of the feature.
 * A service nobody offers and nobody asks for is not a gap; one asked for
 * repeatedly and offered by nobody is.
 */
export const supplyGaps = catchAsync(async (_req, res) => {
  const now = new Date();
  const [demand, supply, types] = await Promise.all([
    CoordinationRequest.aggregate([
      { $addFields: { effectiveStatus: EXPIRED_AWARE_STATUS(now) } },
      { $match: { effectiveStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$serviceTypeId',
          requests: { $sum: 1 },
          notMet: {
            $sum: { $cond: [{ $in: ['$effectiveStatus', ['unmet', 'expired']] }, 1, 0] },
          },
        },
      },
    ]),
    MunicipalityCapability.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$serviceTypeId', providers: { $addToSet: '$municipalityId' } } },
      { $project: { providers: { $size: '$providers' } } },
    ]),
    ServiceType.find({ isActive: true }).sort({ group: 1, sortOrder: 1 }).lean(),
  ]);

  const totalMunicipalities = await Municipality.countDocuments();
  const demandBy = new Map(demand.map((d) => [String(d._id), d]));
  const supplyBy = new Map(supply.map((s) => [String(s._id), s.providers]));

  const rows = types.map((t) => {
    const d = demandBy.get(String(t._id)) ?? { requests: 0, notMet: 0 };
    const providers = supplyBy.get(String(t._id)) ?? 0;
    return {
      serviceType: { _id: t._id, name: t.name, slug: t.slug, icon: t.icon, group: t.group },
      requests: d.requests,
      notMet: d.notMet,
      providers,
      coveragePercent: totalMunicipalities
        ? Math.round((providers / totalMunicipalities) * 100)
        : 0,
      // Sought repeatedly, offered by few or none.
      isPriority: d.notMet > 0 && providers <= 1,
    };
  });

  rows.sort((a, b) => b.notMet - a.notMet || a.providers - b.providers);
  sendSuccess(res, rows, { totalMunicipalities, minN: MIN_N });
});

/**
 * GET /api/coordination/stats/engagement — response behaviour by region.
 *
 * Separates two explanations that look identical in the demand table: *the
 * capability does not exist* versus *the neighbours are not engaging with the
 * platform*. Those call for opposite interventions, and conflating them would
 * make the evidence actively misleading.
 */
export const engagement = catchAsync(async (_req, res) => {
  const rows = await CoordinationRequest.aggregate([
    ...withRegion,
    {
      $lookup: {
        from: 'coordinationresponses',
        localField: '_id',
        foreignField: 'requestId',
        as: 'responses',
      },
    },
    {
      $addFields: {
        responseCount: { $size: '$responses' },
        firstResponseAt: { $min: '$responses.createdAt' },
      },
    },
    {
      $group: {
        _id: '$muni.region',
        requests: { $sum: 1 },
        withAnyResponse: { $sum: { $cond: [{ $gt: ['$responseCount', 0] }, 1, 0] } },
        responsesTotal: { $sum: '$responseCount' },
        hoursToFirst: {
          $push: {
            $cond: [
              { $gt: ['$responseCount', 0] },
              {
                $divide: [
                  { $subtract: ['$firstResponseAt', '$createdAt'] },
                  1000 * 60 * 60,
                ],
              },
              '$$REMOVE',
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        region: '$_id',
        requests: 1,
        withAnyResponse: 1,
        responsesTotal: 1,
        responseRate: {
          $cond: [
            { $gte: ['$requests', MIN_N] },
            { $round: [{ $multiply: [{ $divide: ['$withAnyResponse', '$requests'] }, 100] }, 0] },
            null,
          ],
        },
        // A true median, not a mean relabelled as one: with a handful of
        // requests per region one slow reply would drag an average well away
        // from the typical experience, and the figure is meant to describe the
        // typical one.
        medianHoursToFirstResponse: {
          $let: {
            vars: {
              sorted: { $sortArray: { input: '$hoursToFirst', sortBy: 1 } },
              n: { $size: '$hoursToFirst' },
            },
            in: {
              $cond: [
                { $eq: ['$$n', 0] },
                null,
                {
                  $round: [
                    {
                      $cond: [
                        { $eq: [{ $mod: ['$$n', 2] }, 1] },
                        { $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$n', 2] } }] },
                        {
                          $avg: [
                            { $arrayElemAt: ['$$sorted', { $subtract: [{ $divide: ['$$n', 2] }, 1] }] },
                            { $arrayElemAt: ['$$sorted', { $divide: ['$$n', 2] }] },
                          ],
                        },
                      ],
                    },
                    1,
                  ],
                },
              ],
            },
          },
        },
      },
    },
    { $sort: { requests: -1 } },
  ]);

  sendSuccess(res, rows, { minN: MIN_N });
});

/**
 * GET /api/coordination/stats/isolation — municipalities coordination cannot help.
 *
 * Those with no neighbour within the threshold declaring anything at all. For
 * these comuni the answer is not introduction but provision, which is a different
 * budget line and the reason this is reported separately.
 */
export const isolation = catchAsync(async (req, res) => {
  const thresholdKm = Number(req.query.thresholdKm) || 60;
  const [municipalities, anchors, providers] = await Promise.all([
    Municipality.find().select('name region province').lean(),
    municipalityAnchors(),
    MunicipalityCapability.distinct('municipalityId', { isActive: true }),
  ]);

  const providerSet = new Set(providers.map(String));

  // Straight-line is the right measure here: the question is whether any
  // neighbour exists at all, not how long the drive is. Road distance is always
  // greater, so a comune isolated by straight line is isolated by road too.
  const rows = municipalities.map((m) => {
    const id = String(m._id);
    const anchor = anchors.get(id);
    if (!anchor) {
      return { ...m, hasAnchor: false, neighboursWithin: null, declaringNeighbours: null };
    }
    let neighboursWithin = 0;
    let declaringNeighbours = 0;
    for (const [otherId, otherAnchor] of anchors) {
      if (otherId === id) continue;
      if (haversineKm(anchor, otherAnchor) <= thresholdKm) {
        neighboursWithin += 1;
        if (providerSet.has(otherId)) declaringNeighbours += 1;
      }
    }
    return {
      ...m,
      hasAnchor: true,
      neighboursWithin,
      declaringNeighbours,
      isIsolated: declaringNeighbours === 0,
    };
  });

  rows.sort((a, b) => (a.declaringNeighbours ?? -1) - (b.declaringNeighbours ?? -1));
  sendSuccess(res, rows, { thresholdKm });
});

/** GET /api/coordination/stats/overview — the KPI cards. */
export const coordinationOverview = catchAsync(async (_req, res) => {
  const now = new Date();
  const [agg] = await CoordinationRequest.aggregate([
    { $addFields: { effectiveStatus: EXPIRED_AWARE_STATUS(now) } },
    {
      $group: {
        _id: null,
        requests: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'open'] }, 1, 0] } },
        fulfilled: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'fulfilled'] }, 1, 0] } },
        unmet: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'unmet'] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'expired'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$effectiveStatus', 'cancelled'] }, 1, 0] } },
      },
    },
  ]);

  const [capabilities, declaringMunicipalities, totalMunicipalities, responses] =
    await Promise.all([
      MunicipalityCapability.countDocuments({ isActive: true }),
      MunicipalityCapability.distinct('municipalityId', { isActive: true }),
      Municipality.countDocuments(),
      CoordinationResponse.countDocuments(),
    ]);

  const base = agg ?? { requests: 0, open: 0, fulfilled: 0, unmet: 0, expired: 0, cancelled: 0 };
  const decided = base.fulfilled + base.unmet + base.expired;

  sendSuccess(res, {
    ...base,
    responses,
    capabilities,
    declaringMunicipalities: declaringMunicipalities.length,
    totalMunicipalities,
    decided,
    // Withheld below MIN_N rather than shown as a misleading round number.
    fulfilmentRate: decided >= MIN_N ? Math.round((base.fulfilled / decided) * 100) : null,
    minN: MIN_N,
  });
});
