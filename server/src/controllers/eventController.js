import Event from '../models/Event.js';
import Village from '../models/Village.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/events — public global list.
 * Supports `?upcoming=true` (endDate in the future, sorted ascending),
 * `?region=` and `?villageId=`.
 */
export const listEvents = catchAsync(async (req, res) => {
  const { upcoming, region, villageId } = req.query;
  const filter = {};
  if (villageId) filter.villageId = villageId;
  if (upcoming === 'true') filter.endDate = { $gte: new Date() };

  // Region is a property of the village, so resolve matching villages first.
  if (region) {
    const villageIds = await Village.find({ region }).distinct('_id');
    filter.villageId = filter.villageId ? filter.villageId : { $in: villageIds };
  }

  const events = await Event.find(filter)
    .sort(upcoming === 'true' ? 'startDate' : '-startDate')
    .populate('villageId', 'name slug region');
  sendSuccess(res, events);
});

/** GET /api/villages/:villageId/events — public list for a village. */
export const listVillageEvents = catchAsync(async (req, res) => {
  const filter = { villageId: req.params.villageId };
  if (req.query.upcoming === 'true') filter.endDate = { $gte: new Date() };
  const events = await Event.find(filter).sort('startDate');
  sendSuccess(res, events);
});

/** POST /api/villages/:villageId/events — create (officer/own, admin). */
export const createEvent = catchAsync(async (req, res) => {
  const event = await Event.create({ ...req.body, villageId: req.village._id });
  sendSuccess(res, event, undefined, 201);
});

/** PATCH /api/events/:id — update (ownership via `ownsResource`). */
export const updateEvent = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  delete updates.villageId;
  const event = await Event.findByIdAndUpdate(req.resource._id, updates, {
    new: true,
    runValidators: true,
  });
  sendSuccess(res, event);
});

/** DELETE /api/events/:id — delete (ownership via `ownsResource`). */
export const deleteEvent = catchAsync(async (req, res) => {
  await Event.findByIdAndDelete(req.resource._id);
  sendSuccess(res, { deleted: true, id: req.resource._id });
});
