/**
 * FILE: services/jwtService.js
 * 
 * 1. WHAT: JWT token generation and verification service.
 * 2. WHY: Provides secure, stateless session authentication.
 * 3. HOW: Uses jsonwebtoken with JWT_SECRET from environment variables.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'accessai_super_secret_jwt_key_2026_production';
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name || '',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
};
