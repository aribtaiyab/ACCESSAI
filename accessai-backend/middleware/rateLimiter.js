/**
 * FILE: middleware/rateLimiter.js
 * 
 * 1. WHAT: Rate limiting middleware to prevent abuse.
 * 2. WHY: Protects API from being overwhelmed by too many requests.
 * 3. HOW: Use globally in server.js.
 */

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

module.exports = limiter;
