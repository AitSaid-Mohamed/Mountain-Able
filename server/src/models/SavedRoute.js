import mongoose from 'mongoose';

/**
 * A route a tourist has saved for later reference. Stores enough to redraw the
 * route without recomputing (geometry, distance, duration) and to relabel it
 * (start label + destination village). Scoped to the owning user.
 */
const savedRouteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
    startLabel: { type: String, trim: true },
    startLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    profile: { type: String, enum: ['driving-car', 'cycling-regular', 'foot-walking'], default: 'driving-car' },
    distance: { type: Number }, // metres
    duration: { type: Number }, // seconds
    geometry: { type: [[Number]], default: [] }, // [[lng, lat], ...]
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const SavedRoute = mongoose.model('SavedRoute', savedRouteSchema);
export default SavedRoute;
