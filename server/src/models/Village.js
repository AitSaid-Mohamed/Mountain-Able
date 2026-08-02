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
    // GeoJSON mirror of `location`, kept in sync on write, for geospatial
    // corridor queries (2dsphere index). Coordinates are [lng, lat].
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
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

villageSchema.index({ geo: '2dsphere' });

/** Build the GeoJSON mirror from a `{ lat, lng }` location. */
export const toGeoPoint = (location) =>
  location && Number.isFinite(location.lng) && Number.isFinite(location.lat)
    ? { type: 'Point', coordinates: [location.lng, location.lat] }
    : undefined;

const Village = mongoose.model('Village', villageSchema);
export default Village;
