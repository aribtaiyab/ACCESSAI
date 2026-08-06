/**
 * FILE: controllers/authController.js
 * 
 * 1. WHAT: Authentication controller for signup, login, session, password reset, and logout.
 * 2. WHY: Handles secure user registration, bcrypt password authentication, and JWT sessions.
 * 3. HOW: Uses userService and jwtService.
 */

const userService = require('../services/userService');
const { generateToken } = require('../services/jwtService');

exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required.' 
      });
    }

    const user = await userService.createUser({ email, password, name });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        token,
        access_token: token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'Signup failed.' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required.' 
      });
    }

    const user = await userService.validateUser({ email, password });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password.' 
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
        access_token: token,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated.' 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get session error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve session.' 
    });
  }
};

exports.getSession = exports.getMe;

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required.' 
      });
    }

    const token = await userService.createPasswordResetToken(email);

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset link generated.',
      resetToken: token // Useful for local testing/dev
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'Forgot password request failed.' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and new password are required.' 
      });
    }

    await userService.resetPasswordWithToken(token, password);

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully. You can now log in.' 
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'Password reset failed.' 
    });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
