/**
 * FILE: middleware/errorHandler.js
 * 
 * 1. WHAT: Global error handling middleware.
 * 2. WHY: Catches and formats all errors consistently.
 * 3. HOW: Use as final middleware in server.js.
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    status: status,
  });
};

module.exports = errorHandler;
