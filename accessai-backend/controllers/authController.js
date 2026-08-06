/**
 * FILE: controllers/authController.js
 *
 * 1. WHAT: Authentication controller — signup, login, session, password reset, logout.
 * 2. WHY:  Secure user registration, bcrypt password auth, and JWT sessions.
 * 3. HOW:  Uses userService and jwtService.
 *
 * Fix applied: Replaced fragile string-matching status code derivation with
 * explicit error.statusCode lookup and safe numeric fallback (Bug #8).
 */

const userService       = require('../services/userService');
const { generateToken } = require('../services/jwtService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Helper: extract HTTP status from thrown service errors ─────────────────────
function getStatusCode(error, defaultCode = 500) {
  if (error.statusCode && typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  // Named status codes from userService
  if (error.status && typeof error.status === 'number') {
    return error.status;
  }
  return defaultCode;
}

exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim() || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const user  = await userService.createUser({ email: trimmedEmail, password, name });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token, access_token: token },
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    // FIX: use explicit statusCode from service error, default 400 for signup failures
    const statusCode = getStatusCode(error, 400);
    return res.status(statusCode).json({ success: false, error: error.message || 'Signup failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim() || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const user  = await userService.validateUser({ email: trimmedEmail, password });
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user, token, access_token: token },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    // FIX: use explicit statusCode from service error, default 401 for login failures
    const statusCode = getStatusCode(error, 401);
    return res.status(statusCode).json({ success: false, error: error.message || 'Login failed. Please check your credentials.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    return res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    console.error('Get session error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve session.' });
  }
};

exports.getSession = exports.getMe;

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const token = await userService.createPasswordResetToken(email);

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated.',
      resetToken: token,
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    const statusCode = getStatusCode(error, 400);
    return res.status(statusCode).json({ success: false, error: error.message || 'Forgot password request failed.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required.' });
    }

    await userService.resetPasswordWithToken(token, password);

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    const statusCode = getStatusCode(error, 400);
    return res.status(statusCode).json({ success: false, error: error.message || 'Password reset failed.' });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
