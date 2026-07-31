import mongoose from 'mongoose';

/**
 * A local event (festival, market, seasonal celebration) hosted by a
 * village and bounded by a start and end date.
 */
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true,
      index: true,
    },
    image: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
