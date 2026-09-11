import mongoose from 'mongoose';

export const RESPONSE_TYPES = ['offer', 'partial', 'decline'];

/**
 * One municipality's position on another's request.
 *
 * Its own collection rather than a subdocument array on the request, for four
 * reasons in order of weight:
 *
 *  1. A response is written by a municipality *other than* the one owning the
 *     request. As a subdocument, responding would mean granting write access to
 *     another tenant's document, with an authorisation rule reading "you may
 *     modify this document, but only the one array element that is yours" —
 *     exactly the inline conditional logic this project keeps out of controllers.
 *  2. Several municipalities may respond in the same minute; separate documents
 *     make that trivially safe, where `$push` onto a shared document invites
 *     lost updates.
 *  3. It is queried independently: every response one municipality has made,
 *     median time to first response by region, who never responds.
 *  4. The regional-authority analytics are aggregation pipelines over responses,
 *     which would otherwise need an `$unwind` to reach.
 *
 * `partial` is a first-class outcome, not a variant of `offer`: a neighbour who
 * can send one minibus instead of two is the realistic case in mountain terrain,
 * and collapsing it into yes/no would misrepresent how coordination actually
 * resolves.
 */
const coordinationResponseSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoordinationRequest',
      required: true,
      index: true,
    },
    /** The responding municipality. */
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: true,
      index: true,
    },
    type: { type: String, enum: RESPONSE_TYPES, required: true, index: true },
    message: { type: String, trim: true, maxlength: 2000 },

    // Prefilled from the declared capability, editable. These exist so the two
    // administrations can continue the conversation off-platform; there is
    // deliberately no in-platform thread, which would drift into becoming the
    // contract of record.
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One position per municipality per request — editable afterwards, not duplicated.
coordinationResponseSchema.index({ requestId: 1, municipalityId: 1 }, { unique: true });

const CoordinationResponse = mongoose.model('CoordinationResponse', coordinationResponseSchema);
export default CoordinationResponse;
