/**
 * FILE: services/jwtService.js
 *
 * 1. WHAT: JWT token generation and verification service.
 * 2. WHY:  Provides secure, stateless session authentication.
 * 3. HOW:  Uses jsonwebtoken with JWT_SECRET from environment variables only.
 *
 * Fix applied: Removed hardcoded JWT secret fallback (Bug #9).
 * The server.js startup validation ensures JWT_SECRET is always set.
 * If JWT_SECRET is missing at runtime, token operations throw and return
 * a 401/500 rather than silently using a predictable default.
 */

const jwt = require('jsonwebtoken');

// FIX: No fallback — JWT_SECRET MUST be set via environment variable.
// server.js validates this at startup and exits if missing.
const JWT_SECRET    = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Cannot generate token.');
  }
  const payload = {
    id:    user.id,
    email: user.email,
    name:  user.name || '',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
