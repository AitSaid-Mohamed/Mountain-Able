import mongoose from 'mongoose';

/**
 * A village a tourist has *declared* they visited. This is always
 * self-reported — the platform never infers or detects visits. `visitedAt` is
 * a user-supplied date (defaulting to now); `note` is an optional short memory.
 * A tourist may mark a given village visited at most once (compound unique
 * index), and may edit the date or note later.
 */
const visitedVillageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true, index: true },
    visitedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 280 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// One self-declared visit record per user per village.
visitedVillageSchema.index({ userId: 1, villageId: 1 }, { unique: true });

const VisitedVillage = mongoose.model('VisitedVillage', visitedVillageSchema);
export default VisitedVillage;
