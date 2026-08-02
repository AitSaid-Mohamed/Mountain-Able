import mongoose from 'mongoose';

/**
 * A village a tourist has saved as a favourite. Self-declared, like
 * VisitedVillage — a bookmark the user sets and removes at will. A tourist may
 * favourite a given village at most once (compound unique index).
 */
const favoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

favoriteSchema.index({ userId: 1, villageId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
