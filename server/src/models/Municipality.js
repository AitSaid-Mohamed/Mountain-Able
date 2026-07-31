import mongoose from 'mongoose';

/**
 * An Italian mountain municipality (Comune). Officers belong to a
 * municipality and may only manage the villages that reference it.
 */
const municipalitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    region: { type: String, required: true, trim: true, index: true },
    province: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Municipality = mongoose.model('Municipality', municipalitySchema);
export default Municipality;
