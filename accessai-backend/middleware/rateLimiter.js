/**
 * FILE: middleware/rateLimiter.js
 *
 * 1. WHAT: Rate limiting middleware to prevent abuse.
 * 2. WHY:  Protects API from being overwhelmed and protects Groq API quota.
 * 3. HOW:  Exports a general limiter (all routes) and a tighter AI limiter.
 *
 * Fix applied: Added separate aiLimiter (20 req/min) for AI endpoints
 * to prevent a single client from exhausting the Groq API key.
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter — applied globally
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,                  // 150 requests per 15 min per IP
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Never rate-limit preflight
});

// AI-specific rate limiter — applied only to AI inference routes
// Tighter to prevent Groq quota exhaustion by a single client
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 AI requests per minute per IP
  message: { success: false, error: 'Too many AI requests. Please slow down and try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

module.exports = limiter;
module.exports.aiLimiter = aiLimiter;
