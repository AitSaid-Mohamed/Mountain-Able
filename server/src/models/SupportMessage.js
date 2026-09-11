import mongoose from 'mongoose';

export const SUPPORT_STATUS = ['new', 'handled'];

/**
 * A message submitted through the public support dialog (Contact us / Report an
 * issue in the footer). Persisted so an administrator can actually read it —
 * the form previously showed a success panel and discarded the message, which
 * told the user something untrue.
 *
 * `userId` is recorded when the sender happened to be signed in, so an admin can
 * see who wrote it without the sender having to identify themselves; the email
 * field is what the reply would go to and is required either way.
 */
const supportMessageSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    // Set only when the sender was authenticated; support is open to visitors.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: SUPPORT_STATUS, default: 'new', index: true },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: { type: Date },
  },
  { timestamps: true }
);

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
export default SupportMessage;
