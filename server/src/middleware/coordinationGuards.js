import CoordinationRequest from '../models/CoordinationRequest.js';
import MunicipalityCapability from '../models/MunicipalityCapability.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Authorisation for the coordination feature.
 *
 * Coordination introduces a relationship the rest of the platform does not have:
 * two municipalities acting on the *same* document from opposite sides. The
 * requester owns the request; a recipient may respond to it but must never edit
 * or close it. Each guard below encodes one side of that, and attaches what it
 * loaded so controllers stay thin and never re-query.
 *
 * An `admin` bypasses ownership everywhere, consistently with `ownsVillage`.
 */

/** The caller's municipality, or null for an admin acting platform-wide. */
const callerMunicipality = (req) =>
  req.user.municipalityId ? String(req.user.municipalityId) : null;

/**
 * `ownsCapability` — an officer may only declare or amend capabilities for their
 * own municipality. Admins pass.
 */
export const ownsCapability = catchAsync(async (req, _res, next) => {
  const capability = await MunicipalityCapability.findById(req.params.id);
  if (!capability) return next(new AppError('Capability not found.', 404));

  if (req.user.role === 'admin' || String(capability.municipalityId) === callerMunicipality(req)) {
    req.capability = capability;
    return next();
  }
  return next(
    new AppError('You can only manage the declared services of your own municipality.', 403)
  );
});

/**
 * `ownsRequest` — only the municipality that raised a request may amend or close
 * it. Recipients respond; they do not decide whether somebody else's need was met.
 */
export const ownsRequest = catchAsync(async (req, _res, next) => {
  const request = await CoordinationRequest.findById(req.params.id);
  if (!request) return next(new AppError('Request not found.', 404));

  if (req.user.role === 'admin' || String(request.municipalityId) === callerMunicipality(req)) {
    req.coordinationRequest = request;
    return next();
  }
  return next(new AppError('You can only manage requests raised by your own municipality.', 403));
});

/**
 * `canViewRequest` — the requester, any municipality it was routed to, an admin,
 * or an authority (read-only, for the territorial picture).
 *
 * A request is not public: it is correspondence between administrations, and a
 * comune that was never asked has no reason to read it.
 */
export const canViewRequest = catchAsync(async (req, _res, next) => {
  const request = await CoordinationRequest.findById(req.params.id);
  if (!request) return next(new AppError('Request not found.', 404));

  const mine = callerMunicipality(req);
  const isRecipient = request.recipients.some((r) => String(r.municipalityId) === mine);
  const isOwner = String(request.municipalityId) === mine;

  if (req.user.role === 'admin' || req.user.role === 'authority' || isOwner || isRecipient) {
    req.coordinationRequest = request;
    return next();
  }
  return next(new AppError('This request was not addressed to your municipality.', 403));
});

/**
 * `canRespondToRequest` — only a municipality on the request's frozen recipient
 * list, and only while the request is still open.
 *
 * Checking membership of the stored snapshot rather than re-running the
 * geospatial and routing pipeline is deliberate: it is a cheap array lookup, and
 * it means who may respond cannot drift as capabilities or providers change after
 * the request was sent.
 */
export const canRespondToRequest = catchAsync(async (req, _res, next) => {
  const request = await CoordinationRequest.findById(req.params.id);
  if (!request) return next(new AppError('Request not found.', 404));

  const mine = callerMunicipality(req);
  if (!mine) {
    return next(new AppError('Only an officer of a municipality can respond to a request.', 403));
  }
  if (String(request.municipalityId) === mine) {
    return next(new AppError('You cannot respond to your own request.', 403));
  }
  if (!request.recipients.some((r) => String(r.municipalityId) === mine)) {
    return next(new AppError('This request was not addressed to your municipality.', 403));
  }
  if (request.status !== 'open') {
    return next(new AppError('This request is closed and no longer accepts responses.', 409));
  }

  req.coordinationRequest = request;
  return next();
});
