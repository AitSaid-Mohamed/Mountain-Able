import CoordinationRequest from '../models/CoordinationRequest.js';
import CoordinationResponse from '../models/CoordinationResponse.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildMeta } from '../utils/pagination.js';
import APIFeatures from '../utils/APIFeatures.js';
import { pick } from '../utils/pick.js';
import { sweepExpired, defaultExpiry } from '../utils/coordinationStatus.js';
import { findCandidates, nearestMunicipalities, DEFAULT_RADIUS_KM } from '../services/coordination.js';

/** Open requests a municipality may raise at once — a spam ceiling, not a quota. */
const MAX_OPEN_REQUESTS = 10;

const POPULATE = [
  { path: 'serviceTypeId', select: 'name slug icon group description' },
  { path: 'municipalityId', select: 'name region province' },
  { path: 'fulfilledByMunicipalityId', select: 'name region' },
  { path: 'recipients.municipalityId', select: 'name region province' },
];

/**
 * GET /api/coordination/candidates — preview who a request would reach.
 *
 * Deliberately a separate read before creating anything: an officer must never be
 * unsure which administrations they just contacted. The create endpoint resolves
 * the list again server-side rather than trusting this response.
 */
export const previewCandidates = catchAsync(async (req, res, next) => {
  if (!req.user.municipalityId) {
    return next(new AppError('Your account is not linked to a municipality.', 400));
  }
  const radiusKm = Number(req.query.radiusKm) || DEFAULT_RADIUS_KM;
  const { candidates, rankedBy, originAnchor } = await findCandidates({
    originMunicipalityId: req.user.municipalityId,
    serviceTypeId: req.query.serviceTypeId,
    radiusKm,
  });

  // When a radius matches nobody, offer the nearest few *as suggestions* rather
  // than widening silently — an officer who believes they contacted neighbours
  // must not have quietly contacted a comune four hours away.
  const nearest = candidates.length
    ? []
    : await nearestMunicipalities({ originMunicipalityId: req.user.municipalityId });

  sendSuccess(res, {
    candidates,
    nearest,
    rankedBy,
    radiusKm,
    hasAnchor: Boolean(originAnchor),
  });
});

/**
 * GET /api/coordination/requests — scoped by role.
 *
 * `?box=outgoing` (raised by my municipality) or `?box=incoming` (routed to it).
 * Admins and authorities see everything; the territorial picture is the point of
 * the authority role, and moderation is the point of the admin one.
 */
export const listRequests = catchAsync(async (req, res) => {
  await sweepExpired();

  const filter = {};
  const mine = req.user.municipalityId;

  if (req.user.role === 'officer') {
    if (req.query.box === 'incoming') filter['recipients.municipalityId'] = mine;
    else filter.municipalityId = mine;
  } else if (req.query.municipalityId) {
    filter.municipalityId = req.query.municipalityId;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.serviceTypeId) filter.serviceTypeId = req.query.serviceTypeId;

  const total = await CoordinationRequest.countDocuments(filter);
  const features = new APIFeatures(CoordinationRequest.find(), req.query)
    .filter(filter)
    .sort({ newest: '-createdAt', oldest: 'createdAt' }, 'newest')
    .paginate({ defaultLimit: 20, maxLimit: 100 });

  const requests = await features.query.populate(POPULATE);

  // Response counts, in one pipeline rather than a query per request.
  const ids = requests.map((r) => r._id);
  const counts = await CoordinationResponse.aggregate([
    { $match: { requestId: { $in: ids } } },
    { $group: { _id: { requestId: '$requestId', type: '$type' }, n: { $sum: 1 } } },
  ]);
  const byRequest = new Map();
  for (const c of counts) {
    const key = String(c._id.requestId);
    const entry = byRequest.get(key) ?? { offer: 0, partial: 0, decline: 0, total: 0 };
    entry[c._id.type] = c.n;
    entry.total += c.n;
    byRequest.set(key, entry);
  }

  const data = requests.map((r) => ({
    ...r.toJSON(),
    responseCounts: byRequest.get(String(r._id)) ?? { offer: 0, partial: 0, decline: 0, total: 0 },
  }));

  sendSuccess(res, data, buildMeta(total, features.page, features.limit));
});

/** GET /api/coordination/requests/:id — detail with responses (`canViewRequest`). */
export const getRequest = catchAsync(async (req, res) => {
  await sweepExpired();
  const request = await CoordinationRequest.findById(req.coordinationRequest._id).populate(POPULATE);
  const responses = await CoordinationResponse.find({ requestId: request._id })
    .populate('municipalityId', 'name region province')
    .sort('createdAt');

  sendSuccess(res, { ...request.toJSON(), responses });
});

/**
 * POST /api/coordination/requests — raise a request.
 *
 * The recipient list is resolved here and frozen onto the document. It is not
 * taken from the client: the preview endpoint informs the officer, but the server
 * decides who is actually contacted.
 */
export const createRequest = catchAsync(async (req, res, next) => {
  const municipalityId = req.user.municipalityId;
  if (!municipalityId) {
    return next(new AppError('Your account is not linked to a municipality.', 400));
  }

  const openCount = await CoordinationRequest.countDocuments({ municipalityId, status: 'open' });
  if (openCount >= MAX_OPEN_REQUESTS) {
    return next(
      new AppError(
        `Your municipality already has ${MAX_OPEN_REQUESTS} open requests. Close one before raising another.`,
        409
      )
    );
  }

  const payload = pick(req.body, [
    'serviceTypeId', 'title', 'details', 'neededFrom', 'neededTo', 'peopleCount', 'radiusKm',
  ]);
  payload.radiusKm = Number(payload.radiusKm) || DEFAULT_RADIUS_KM;

  const { candidates, rankedBy } = await findCandidates({
    originMunicipalityId: municipalityId,
    serviceTypeId: payload.serviceTypeId,
    radiusKm: payload.radiusKm,
  });

  if (!candidates.length) {
    return next(
      new AppError(
        'No municipality within this radius has declared that service. Widen the radius or choose another service.',
        422,
        { radiusKm: 'No candidate municipalities found.' }
      )
    );
  }

  const request = await CoordinationRequest.create({
    ...payload,
    municipalityId,
    createdBy: req.user._id,
    status: 'open',
    rankedBy,
    expiresAt: defaultExpiry(payload),
    recipients: candidates.map((c) => ({
      municipalityId: c.municipalityId,
      travelMinutes: c.travelMinutes,
      travelKm: c.travelKm,
    })),
  });

  const populated = await CoordinationRequest.findById(request._id).populate(POPULATE);
  sendSuccess(res, populated, undefined, 201);
});

/**
 * PATCH /api/coordination/requests/:id — close it (`ownsRequest`).
 *
 * Only the requester decides whether their need was met: a neighbour's offer is
 * not the same as the need being satisfied, which is why responses never move the
 * status by themselves. Terminal states are final — a recurring need is a new
 * request, so that "how many times was this sought" stays answerable.
 */
export const closeRequest = catchAsync(async (req, res, next) => {
  const request = req.coordinationRequest;
  if (request.status !== 'open') {
    return next(new AppError('This request is already closed.', 409));
  }

  const status = req.body.status;
  const updates = {
    status,
    closedAt: new Date(),
    ...pick(req.body, ['closedNote']),
  };

  if (status === 'fulfilled' && req.body.fulfilledByMunicipalityId) {
    const named = String(req.body.fulfilledByMunicipalityId);
    const isRecipient = request.recipients.some((r) => String(r.municipalityId) === named);
    if (!isRecipient) {
      return next(
        new AppError('That municipality was not among this request\'s recipients.', 422, {
          fulfilledByMunicipalityId: 'Not a recipient of this request.',
        })
      );
    }
    updates.fulfilledByMunicipalityId = named;
  }

  // An admin closing someone else's request is a moderation action; record it as
  // one so the audit trail does not read as the requester's own decision.
  if (req.user.role === 'admin' && String(request.municipalityId) !== String(req.user.municipalityId)) {
    updates.closedByAdmin = true;
  }

  const updated = await CoordinationRequest.findByIdAndUpdate(request._id, updates, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);

  sendSuccess(res, updated);
});

/**
 * POST /api/coordination/requests/:id/responses — offer, partly offer or decline
 * (`canRespondToRequest`).
 *
 * Upserts, so a municipality may change its position — an offer withdrawn when a
 * vehicle breaks down is more useful than a stale yes.
 */
export const respondToRequest = catchAsync(async (req, res) => {
  const payload = pick(req.body, ['type', 'message', 'contactName', 'contactEmail', 'contactPhone']);
  payload.createdBy = req.user._id;

  const response = await CoordinationResponse.findOneAndUpdate(
    { requestId: req.coordinationRequest._id, municipalityId: req.user.municipalityId },
    {
      $set: payload,
      $setOnInsert: {
        requestId: req.coordinationRequest._id,
        municipalityId: req.user.municipalityId,
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('municipalityId', 'name region province');

  sendSuccess(res, response, undefined, 201);
});

/**
 * GET /api/coordination/inbox — the badge counts behind the sidebar indicator.
 *
 * One small endpoint read on dashboard mount, rather than a polling loop: the
 * natural rhythm of this workflow is days, so a count that is correct whenever
 * the officer opens the dashboard is proportionate.
 */
export const inboxSummary = catchAsync(async (req, res) => {
  await sweepExpired();
  const mine = req.user.municipalityId;
  if (!mine) return sendSuccess(res, { awaitingResponse: 0, newResponses: 0 });

  const incoming = await CoordinationRequest.find({
    'recipients.municipalityId': mine,
    status: 'open',
  }).select('_id');

  const answered = await CoordinationResponse.find({
    requestId: { $in: incoming.map((r) => r._id) },
    municipalityId: mine,
  }).select('requestId');
  const answeredIds = new Set(answered.map((a) => String(a.requestId)));

  const outgoingOpen = await CoordinationRequest.find({
    municipalityId: mine,
    status: 'open',
  }).select('_id');
  const newResponses = await CoordinationResponse.countDocuments({
    requestId: { $in: outgoingOpen.map((r) => r._id) },
  });

  sendSuccess(res, {
    awaitingResponse: incoming.filter((r) => !answeredIds.has(String(r._id))).length,
    newResponses,
  });
});
