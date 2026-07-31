import mongoose from 'mongoose';

/** Geographic coordinate sub-document (WGS84). */
const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * A mountain village — the central entity of the platform. A village
 * belongs to one municipality and aggregates attractions, events and
 * community reviews. `ratingAverage` / `ratingCount` are maintained
 * automatically by the Comment model (see Comment.recalculateRatings).
 */
const villageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, trim: true },
    region: { type: String, required: true, trim: true, index: true },
    province: { type: String, required: true, trim: true },
    location: { type: pointSchema, required: true },
    altitude: { type: Number },
    population: { type: Number },
    images: { type: [String], default: [] },
    coverImage: { type: String },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: true,
      index: true,
    },
    ratingAverage: { type: Number, default: 0, index: true },
    ratingCount: { type: Number, default: 0 },
    stats: {
      hotels: { type: Number, default: 0 },
      shops: { type: Number, default: 0 },
    },
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Village = mongoose.model('Village', villageSchema);
export default Village;
