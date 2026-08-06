/**
 * FILE: middleware/authMiddleware.js
 * 
 * 1. WHAT: Production JWT authentication middleware.
 * 2. WHY: Protects private routes and attaches user data to req.user.
 * 3. HOW: Verifies JWT token and looks up user in database.
 */

const { verifyToken } = require('../services/jwtService');
const { getUserById } = require('../services/userService');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required. Please sign in.' 
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token format.' 
      });
    }

    // Verify JWT
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Your session has expired. Please sign in again.' 
      });
    }

    // Retrieve active user from database
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User account no longer exists.' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed. Please sign in again.' 
    });
  }
};

// Optional auth middleware (for routes like chat/companion that work for guests too)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        const user = await getUserById(decoded.id);
        if (user) {
          req.user = user;
          req.token = token;
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
