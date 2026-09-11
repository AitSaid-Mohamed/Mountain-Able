import mongoose from 'mongoose';

/**
 * A service a municipality declares it can offer to a neighbouring comune.
 *
 * The platform does not verify these declarations and cannot: it is a directory,
 * not an accreditation body. What it does instead is make provenance visible —
 * every declaration records who declared it and when it was last confirmed, so a
 * neighbour can weigh a five-year-old entry differently from last month's. The
 * counterparty is another public administration, and the failure mode of an
 * optimistic declaration is a wasted phone call, not a lost payment.
 */
const municipalityCapabilitySchema = new mongoose.Schema(
  {
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
    /** Free-text detail: "nine-seat minibus, weekdays only". */
    description: { type: String, trim: true, maxlength: 1000 },

    // Who a neighbouring officer should approach. The arrangement itself happens
    // off-platform between the two administrations — these fields are the whole
    // mechanism for that, and the reason no in-platform messaging thread exists.
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },

    /** Pause an offer (seasonal, vehicle off the road) without losing the record. */
    isActive: { type: Boolean, default: true, index: true },

    declaredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /** Last time an officer confirmed this is still true; drives the stale flag. */
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One declaration per service per municipality — detail belongs in `description`,
// not in duplicate rows.
municipalityCapabilitySchema.index({ municipalityId: 1, serviceTypeId: 1 }, { unique: true });

/** A declaration not confirmed in this long is shown as stale to its own officer. */
export const STALE_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

const MunicipalityCapability = mongoose.model(
  'MunicipalityCapability',
  municipalityCapabilitySchema
);
export default MunicipalityCapability;
