require('dotenv').config();

/**
 * Centralized configuration management
 * All environment variables are validated and accessed through this module
 */
const config = {
  server: {
    port: process.env.PORT || 5001,
    env: process.env.NODE_ENV || 'development',
  },
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-platform',
  },
  
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Fallback gracefully if no API key
    enabled: !!process.env.ANTHROPIC_API_KEY,
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'Contract Platform <noreply@contractplatform.com>',
    // Email is optional - system works without it
    enabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: ['application/pdf', 'text/plain'],
  },
  
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

// Validate critical configuration
function validateConfig() {
  const errors = [];
  
  if (!config.ai.anthropicApiKey) {
    errors.push('ANTHROPIC_API_KEY is required for AI features');
  }
  
  if (!config.database.uri) {
    errors.push('MONGODB_URI is required');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
}

validateConfig();

module.exports = config;