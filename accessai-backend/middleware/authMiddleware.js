/**
 * FILE: middleware/authMiddleware.js
 * 
 * 1. WHAT: Validates Supabase auth tokens for protected routes.
 * 2. WHY: Ensures only authenticated users can access certain API endpoints.
 * 3. HOW: Used as a middleware function in route definitions.
 */

/**
 * FILE: middleware/authMiddleware.js
 * 
 * 1. WHAT: Authentication middleware for protected routes.
 * 2. WHY: Verifies JWT tokens and attaches user info to requests.
 * 3. HOW: Use as middleware on protected routes.
 */

const supabase = require('../lib/supabaseClient');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Missing or invalid Authorization header' 
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Attach user to request for downstream use
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

module.exports = authMiddleware;
