import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import config from '../config/env.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, '..', '..', config.uploadDir);

// Ensure the target folder exists at startup.
fs.mkdirSync(uploadRoot, { recursive: true });

// Declared MIME → canonical extension. The extension is derived from the
// accepted type, never from the client's filename, so no path separator or
// traversal sequence from `originalname` can reach the stored filename.
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] ?? '.bin';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`); // e.g. 1730000000000-123456789.jpg
  },
});

/** Reject on declared MIME first (cheap). SVG is intentionally excluded. */
function fileFilter(_req, file, cb) {
  if (MIME_EXT[file.mimetype]) return cb(null, true);
  cb(new AppError('Only image files (jpg, jpeg, png, webp) are allowed.', 400));
}

/**
 * `upload` — multer instance storing images under `/uploads`. Declared MIME is
 * checked here; the actual bytes are verified by `verifyImageBytes` below.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

/** Does `buf` start with a JPEG/PNG/WebP signature? (SVG/HTML never match.) */
function hasImageMagic(buf) {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WebP: "RIFF"...."WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true;
  return false;
}

/**
 * `verifyImageBytes` — post-multer guard that reads the real file signature
 * (magic bytes) rather than trusting the client-declared MIME type. Any file
 * whose content is not genuinely a JPEG/PNG/WebP (e.g. an SVG or HTML payload
 * with a spoofed type) is deleted and rejected. Run after `upload.*`.
 */
export const verifyImageBytes = catchAsync(async (req, _res, next) => {
  const files = req.files ?? (req.file ? [req.file] : []);
  for (const file of files) {
    const fd = await fs.promises.open(file.path, 'r');
    try {
      const { buffer } = await fd.read(Buffer.alloc(12), 0, 12, 0);
      if (!hasImageMagic(buffer)) {
        await fd.close();
        await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
        return next(new AppError('Uploaded file is not a valid image.', 400));
      }
    } finally {
      await fd.close().catch(() => {});
    }
  }
  next();
});
