/**
 * FILE: controllers/authController.js
 * 
 * 1. WHAT: Handles authentication-related logic using Supabase.
 * 2. WHY: Centralizes auth logic for cleaner route definitions.
 * 3. HOW: Imported and called by authRoutes.js.
 * 
 * CRITICAL: Uses admin.createUser with email_confirm: true to auto-confirm email
 * This prevents users from getting "email not confirmed" errors.
 */

const supabase = require('../lib/supabaseClient');

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    let data, error;
    if (supabase.auth.admin) {
      const res = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      data = res.data;
      error = res.error;
    } else {
      console.warn('Admin client not available, using standard signUp (email confirmation may be required)');
      const res = await supabase.auth.signUp({
        email,
        password,
      });
      data = res.data;
      error = res.error;
    }

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data: { user: data.user } });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      data: { 
        user: data.user, 
        session: data.session,
        access_token: data.session?.access_token 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, error: 'Forgot password failed' });
  }
};

exports.resetPassword = async (req, res) => {
  // This would typically be handled on the frontend with the reset token
  return res.status(200).json({ success: true, message: 'Reset password endpoint' });
};

exports.verifyEmail = async (req, res) => {
  // Supabase handles email verification automatically
  return res.status(200).json({ success: true, message: 'Email verification handled by Supabase' });
};

exports.getSession = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get session' });
  }
};
