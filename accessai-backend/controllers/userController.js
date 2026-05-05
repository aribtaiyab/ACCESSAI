/**
 * FILE: controllers/userController.js
 * 1. WHAT: User profile management using Supabase.
 * 2. WHY: Allow users to update profile and password.
 * 3. HOW: Called by userRoutes.js.
 */

const supabase = require('../lib/supabaseClient');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    return res.json({ success: true, data: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { email } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const updatePayload = {};
    if (email) updatePayload.email = email;

    const { data, error } = await supabase.auth.admin.updateUserById(userId, updatePayload);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data.user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, { password });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update password' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Delete user data first
    await supabase.from('history').delete().eq('user_id', userId);
    await supabase.from('settings').delete().eq('user_id', userId);
    await supabase.from('org_audits').delete().eq('user_id', userId);

    // Then delete user
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
};
