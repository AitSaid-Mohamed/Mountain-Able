import mongoose from 'mongoose';

/**
 * A thematic category used to classify attractions
 * (e.g. Nature, Food & Wine, Hiking). `icon` stores a lucide-react icon
 * name so the frontend can render it directly.
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, trim: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
