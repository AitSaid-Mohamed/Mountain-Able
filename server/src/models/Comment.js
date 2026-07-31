import mongoose from 'mongoose';

export const COMMENT_STATUS = ['pending', 'approved', 'rejected'];

/**
 * A community review of a village: free-text content plus a 1–5 star rating.
 * Comments are moderated (`status`); only `approved` comments contribute to
 * the parent village's aggregated rating.
 *
 * Ratings are NEVER computed on the fly in a controller. Instead the static
 * `recalculateRatings` recomputes the village aggregates and is triggered by
 * the post-save / post-update / post-delete hooks below, so the denormalised
 * `Village.ratingAverage` and `Village.ratingCount` stay consistent whenever a
 * comment is created, edited, deleted or has its moderation status changed.
 */
const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true,
      index: true,
    },
    status: { type: String, enum: COMMENT_STATUS, default: 'approved', index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// A user may review a given village at most once. The database is the source
// of truth for this rule; the controller adds a friendly 409 on top.
commentSchema.index({ userId: 1, villageId: 1 }, { unique: true });

/**
 * Recompute and persist `ratingAverage` and `ratingCount` on a village from
 * its currently approved comments. Called from the hooks below.
 *
 * @param {mongoose.Types.ObjectId|string} villageId
 */
commentSchema.statics.recalculateRatings = async function recalculateRatings(villageId) {
  if (!villageId) return;

  const [summary] = await this.aggregate([
    { $match: { villageId: new mongoose.Types.ObjectId(villageId), status: 'approved' } },
    {
      $group: {
        _id: '$villageId',
        ratingCount: { $sum: 1 },
        ratingAverage: { $avg: '$rating' },
      },
    },
  ]);

  const ratingCount = summary?.ratingCount ?? 0;
  // Round the average to one decimal for stable, display-friendly values.
  const ratingAverage = summary ? Math.round(summary.ratingAverage * 10) / 10 : 0;

  await mongoose.model('Village').findByIdAndUpdate(villageId, {
    ratingAverage,
    ratingCount,
  });
};

// --- Hooks ----------------------------------------------------------------
// Cover every write path so the aggregates never drift:
//   • document .save()          → post('save')
//   • Model.findOneAndUpdate    → post('findOneAndUpdate')  (e.g. moderation)
//   • Model.findOneAndDelete /
//     findByIdAndDelete         → post('findOneAndDelete')

// NOTE: each hook returns the recalculation promise so Mongoose awaits it
// before the write operation resolves — this keeps the aggregates consistent
// and free of race conditions.

commentSchema.post('save', function afterSave(doc) {
  return doc.constructor.recalculateRatings(doc.villageId);
});

commentSchema.post('findOneAndUpdate', function afterUpdate(doc) {
  if (doc) return this.model.recalculateRatings(doc.villageId);
});

commentSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) return this.model.recalculateRatings(doc.villageId);
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
