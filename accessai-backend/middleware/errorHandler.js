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

  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      reply: 'That image is too big! Please use a smaller one.',
      error: 'That image is too big! Please use a smaller one.',
    });
  }

  const status = err.status || 500;
  const message = err.message || "Something went wrong on our end. Let's try again!";

  res.status(status).json({
    success: false,
    error: message,
    status: status,
  });
};

module.exports = errorHandler;
