import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 104857600; // 100MB

// Storage configuration for app files
const appStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

// Storage configuration for icons
const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'icons'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

// File filter for app files
const appFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.apk', '.aab', '.zip'];
  const allowedMimeTypes = [
    'application/vnd.android.package-archive',
    'application/octet-stream',
    'application/zip',
    'application/x-zip-compressed'
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé. Utilisez: ${allowedExtensions.join(', ')}`), false);
  }
};

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const allowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/webp'
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format d'image non autorisé. Utilisez: ${allowedExtensions.join(', ')}`), false);
  }
};

// Multer instance for app uploads
export const uploadApp = multer({
  storage: appStorage,
  fileFilter: appFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

// Multer instance for icon uploads
export const uploadIcon = multer({
  storage: iconStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

// Multer instance for screenshot uploads
export const uploadScreenshots = multer({
  storage: iconStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 8 // Max 8 screenshots
  }
});

// Error handler middleware for multer
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: `Fichier trop volumineux. Taille max: ${formatSize(MAX_FILE_SIZE)}`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ error: 'Trop de fichiers uploadés' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ error: 'Champ de fichier inattendu' });
      default:
        return res.status(400).json({ error: `Erreur d'upload: ${err.message}` });
    }
  }

  if (err.message) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
}

// Format file size helper
function formatSize(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}
