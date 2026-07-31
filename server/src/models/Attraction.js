import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

/**
 * A point of interest inside a village (a church, museum, trailhead,
 * viewpoint, etc.), classified by a Category.
 */
const attractionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true,
      index: true,
    },
    images: { type: [String], default: [] },
    location: { type: pointSchema },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Attraction = mongoose.model('Attraction', attractionSchema);
export default Attraction;
