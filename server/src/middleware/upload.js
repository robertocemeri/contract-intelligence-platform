const multer = require('multer');
const path = require('path');
const config = require('../config');

/**
 * File Upload Middleware
 * Handles PDF and text file uploads with validation
 */

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and text files are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Middleware with error handling
const uploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('contract');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          ok: false,
          error: `File too large. Maximum size is ${config.upload.maxFileSize / 1024 / 1024}MB`,
        });
      }
      return res.status(400).json({
        ok: false,
        error: err.message,
      });
    } else if (err) {
      return res.status(400).json({
        ok: false,
        error: err.message,
      });
    }
    next();
  });
};

module.exports = { uploadMiddleware };