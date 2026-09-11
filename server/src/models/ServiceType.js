import mongoose from 'mongoose';

/** Grouping used to organise the taxonomy on screen. */
export const SERVICE_GROUPS = ['mobility', 'expertise', 'facilities', 'supply', 'emergency'];

/**
 * A service a municipality can declare it is able to offer to a neighbour.
 *
 * A fixed, seeded vocabulary rather than free text: aggregating declarations and
 * requests across the territory is half the point of the coordination feature,
 * and free text does not aggregate. Administrators may extend the list, but a
 * type that is in use cannot be deleted — retiring it (`isActive: false`) keeps
 * the historical record intact, which is what the regional-authority analytics
 * are built on.
 */
const serviceTypeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    // A lucide-react icon name, matching how Category stores its icon.
    icon: { type: String, trim: true, default: 'Sparkles' },
    group: { type: String, enum: SERVICE_GROUPS, required: true, index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

serviceTypeSchema.index({ group: 1, sortOrder: 1 });

const ServiceType = mongoose.model('ServiceType', serviceTypeSchema);
export default ServiceType;
