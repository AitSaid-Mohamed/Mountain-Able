import fs from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/env.js';

/**
 * Where uploaded images are kept.
 *
 * Two backends, chosen by configuration rather than by environment name:
 *
 * - **Cloudinary**, when `CLOUDINARY_URL` is set. The file is uploaded and the
 *   returned HTTPS URL is what gets persisted on the document.
 * - **Local disk**, otherwise — the existing `/uploads` behaviour, which is
 *   right for development and needs no account or credential.
 *
 * This exists because a managed host's filesystem is ephemeral. On Render the
 * disk is wiped on every restart and every redeploy, so an image uploaded
 * through the village editor would survive only until the next deploy and then
 * disappear, leaving a broken link in a village page that looked fine when it
 * was created. Nothing in the application would report an error; the file would
 * simply cease to exist.
 *
 * Keying off the presence of the credential rather than off `NODE_ENV` means a
 * developer can test the Cloudinary path locally by exporting one variable, and
 * a production deployment that forgets the variable degrades to local storage
 * rather than crashing — with a warning at startup, because that degradation is
 * silent data loss and must not pass unnoticed.
 */

let configured = false;

/** True when Cloudinary is configured and should be used. */
export const usingCloudinary = () => Boolean(config.cloudinaryUrl);

/**
 * Configure the SDK once, lazily.
 *
 * The SDK reads `CLOUDINARY_URL` from the environment by itself, so no secret is
 * passed around or logged here.
 */
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({ secure: true });
  configured = true;
}

/**
 * Persist an already-validated upload and return the URL to store.
 *
 * Call only **after** `verifyImageBytes`: the magic-byte check must happen
 * before anything leaves the machine, so a spoofed file is rejected rather than
 * uploaded and then deleted.
 *
 * @param {Express.Multer.File} file  a multer disk-storage file
 * @param {string} folder  Cloudinary folder, ignored by the local backend
 * @returns {Promise<string>} an absolute HTTPS URL, or a `/uploads/...` path
 */
export async function storeImage(file, folder = 'mountain-able') {
  if (!usingCloudinary()) return `/uploads/${file.filename}`;

  ensureConfigured();
  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: 'image',
    // The filename multer generated is already unique and carries no
    // client-supplied text; reusing it keeps the two backends traceable to each
    // other. `unique_filename: false` prevents Cloudinary appending its own
    // suffix on top of that.
    public_id: file.filename.replace(/\.[^.]+$/, ''),
    unique_filename: false,
    overwrite: false,
  });

  // The local copy was only ever a staging file once Cloudinary holds the
  // image. Failing to remove it is not worth failing the request over.
  await fs.promises.unlink(file.path).catch(() => {});

  return result.secure_url;
}

/** Store several uploads, preserving order. */
export async function storeImages(files, folder) {
  const out = [];
  for (const file of files) out.push(await storeImage(file, folder));
  return out;
}

/**
 * Remove a stored image, given whatever was persisted on the document.
 *
 * Best-effort by design: a delete that fails must not prevent the database
 * record from being updated, or the user would be unable to remove an image
 * from a village because of a storage-provider hiccup. The cost of a missed
 * delete is an orphaned file; the cost of a blocked delete is a broken feature.
 *
 * @param {string} stored  a Cloudinary URL or a `/uploads/...` path
 */
export async function deleteImage(stored) {
  if (!stored) return;

  if (stored.startsWith('/uploads/')) {
    const path = new URL(`../../${config.uploadDir}/${stored.split('/').pop()}`, import.meta.url);
    await fs.promises.unlink(path).catch(() => {});
    return;
  }

  if (!usingCloudinary() || !stored.includes('res.cloudinary.com')) return;

  // Recover the public id from the delivery URL: everything after the version
  // segment, minus the extension. e.g.
  //   https://res.cloudinary.com/<cloud>/image/upload/v123/folder/name.jpg
  //                                                     └── folder/name ──┘
  const match = stored.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/);
  if (!match) return;

  ensureConfigured();
  await cloudinary.uploader.destroy(match[1]).catch(() => {});
}

/**
 * Warn once at startup if a production deployment is about to write uploads to
 * a disk that will not survive the next redeploy.
 */
export function warnIfEphemeralStorage() {
  if (config.nodeEnv === 'production' && !usingCloudinary()) {
    console.warn(
      '⚠️  CLOUDINARY_URL is not set. Uploaded images will be written to the ' +
        'local filesystem, which is wiped on every restart and redeploy on a ' +
        'managed host. Existing images will disappear. Set CLOUDINARY_URL to ' +
        'persist uploads.'
    );
  }
}
