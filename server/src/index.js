const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const contractRoutes = require('./routes/contracts');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/**
 * Server Setup
 * Production-ready Express server with security and error handling
 */

const app = express();

// Trust proxy for rate limiting (required by express-rate-limit)
// In production, set this to the number of proxies (e.g., 1 for single load balancer)
if (config.server.env === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development to avoid trust proxy warning
  skip: (req) => config.server.env === 'development',
  message: {
    ok: false,
    error: 'Too many requests, please try again later',
  },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
if (!fs.existsSync(config.upload.uploadDir)) {
  fs.mkdirSync(config.upload.uploadDir, { recursive: true });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      aiEnabled: config.ai.enabled,
      emailEnabled: config.email.enabled,
    },
  });
});

// API Routes
app.use('/api/contracts', contractRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
mongoose.connect(config.database.uri)
  .then(() => {
    console.log('✓ MongoDB connected');
    
    // Start server
    app.listen(config.server.port, () => {
      console.log(`✓ Server running on port ${config.server.port}`);
      console.log(`✓ Environment: ${config.server.env}`);
      console.log(`✓ AI Service: ${config.ai.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`✓ Email Service: ${config.email.enabled ? 'Enabled' : 'Disabled'}`);
      console.log('\nReady to accept requests!');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;