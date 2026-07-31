import mongoose from 'mongoose';

export const OFFICER_REQUEST_STATUS = ['pending', 'approved', 'rejected'];

/**
 * A public request to obtain an `officer` account. Submitting the officer
 * request form creates both a `pending` officer User and one of these records,
 * which preserves the applicant's free-text `message` and gives admins an
 * auditable moderation queue. `reviewedBy` / `reviewedAt` capture who acted on
 * the request and when.
 */
const officerRequestSchema = new mongoose.Schema(
  {
    requesterName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    municipalityName: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    province: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: OFFICER_REQUEST_STATUS, default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const OfficerRequest = mongoose.model('OfficerRequest', officerRequestSchema);
export default OfficerRequest;
