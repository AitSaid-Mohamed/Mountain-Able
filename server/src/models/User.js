import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['tourist', 'officer', 'admin', 'authority'];
export const USER_STATUS = ['pending', 'active', 'suspended'];

/**
 * Application user.
 *
 * Roles:
 *  - tourist   self-registers; browses, searches, comments, rates
 *  - officer   municipality officer; manages villages of their own municipality
 *  - admin     full access; moderation and user management
 *  - authority regional authority; read-only aggregated statistics
 *
 * Officers must reference a `municipalityId` and start with status `pending`
 * until an admin approves them. The password is hashed with bcrypt on save
 * and excluded from query results by default (`select: false`).
 */
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'tourist', index: true },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      // Required only for officers — enforced in the validator below.
      required: function () {
        return this.role === 'officer';
      },
    },
    avatar: { type: String },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    status: { type: String, enum: USER_STATUS, default: 'active' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

/** Hash the password whenever it is set or changed. */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Compare a candidate plaintext password against the stored hash.
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Never leak the password hash when serialising to JSON. */
userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
