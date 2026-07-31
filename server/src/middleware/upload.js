import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import config from '../config/env.js';
import AppError from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, '..', '..', config.uploadDir);

// Ensure the target folder exists at startup.
fs.mkdirSync(uploadRoot, { recursive: true });

/**
 * `upload` — multer instance that stores uploaded images on the local disk
 * under `/uploads`. Wired up in the CRUD milestone; provided here so image
 * handling is ready. Accepts common image types up to 5 MB and generates a
 * collision-free filename.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('Only image files (jpg, jpeg, png, webp) are allowed.', 400));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
