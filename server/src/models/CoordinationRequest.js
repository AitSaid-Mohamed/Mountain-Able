import mongoose from 'mongoose';

export const REQUEST_STATUS = ['open', 'fulfilled', 'unmet', 'cancelled', 'expired'];

/** How the recipient list was ordered — carried so the UI can show provenance. */
export const RANKED_BY = ['road', 'straight-line'];

/**
 * A snapshot of one municipality the request was routed to, frozen at send time.
 *
 * Deliberately not recomputed on read. It records who was *actually* asked, which
 * is the auditable fact; re-running the geospatial and routing pipeline later
 * would silently rewrite that history as capabilities and providers change. It
 * also means the record survives the routing provider being unreachable months
 * later, and makes "may this municipality respond?" a cheap array lookup.
 */
const recipientSchema = new mongoose.Schema(
  {
    municipalityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipality', required: true },
    travelMinutes: { type: Number, default: null },
    travelKm: { type: Number, default: null },
  },
  { _id: false }
);

/**
 * A request from one municipality to its neighbours for a service it cannot
 * provide itself.
 *
 * The platform introduces the two administrations and records the outcome. It is
 * never a party to the arrangement: there is no price, no availability, no
 * booking and no confirmation here, because the agreement happens off-platform
 * between the two comuni exactly as it does today.
 */
const coordinationRequestSchema = new mongoose.Schema(
  {
    /** The requesting municipality. */
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: true,
      index: true,
    },
    serviceTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceType',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    details: { type: String, trim: true, maxlength: 3000 },

    neededFrom: { type: Date },
    neededTo: { type: Date },
    peopleCount: { type: Number, min: 1 },

    /** The search radius used when the recipients were resolved. */
    radiusKm: { type: Number, required: true },
    recipients: { type: [recipientSchema], default: [] },
    rankedBy: { type: String, enum: RANKED_BY, default: 'road' },

    status: { type: String, enum: REQUEST_STATUS, default: 'open', index: true },

    /** Set when the requester closes the request as fulfilled. Optional: the
     *  need may have been met by more than one neighbour, or informally. */
    fulfilledByMunicipalityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipality' },
    closedAt: { type: Date },
    closedNote: { type: String, trim: true, maxlength: 1000 },
    /** Set when an admin closes a request as a moderation action. */
    closedByAdmin: { type: Boolean, default: false },

    /**
     * Expiry turns silence into data. An `open` request nobody will ever answer
     * makes the feature look abandoned and tells the regional authority nothing;
     * one that expires unanswered is evidence the capability was absent.
     *
     * Applied lazily — computed on read, persisted on the next write — because
     * the platform has no job runner and adding one for this is disproportionate.
     * Anything that counts requests by status must therefore apply the same
     * cutoff at query time; see `utils/coordinationStatus.js`.
     */
    expiresAt: { type: Date, required: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

coordinationRequestSchema.index({ status: 1, createdAt: -1 });
coordinationRequestSchema.index({ 'recipients.municipalityId': 1, status: 1 });

const CoordinationRequest = mongoose.model('CoordinationRequest', coordinationRequestSchema);
export default CoordinationRequest;
