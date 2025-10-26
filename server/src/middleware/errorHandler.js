/**
 * Global Error Handler Middleware
 * Consistent error responses following Selego principles
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    ok: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Route not found',
  });
};

module.exports = { errorHandler, notFoundHandler };