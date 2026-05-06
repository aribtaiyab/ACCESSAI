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

    // Fetch user profile from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('Fetching profile from users table failed, falling back to auth user', error.message);
      return res.json({ success: true, data: req.user });
    }

    // Return merged data to satisfy both usages
    const mergedData = { 
      ...req.user, 
      ...data, 
      user_metadata: { 
        ...(req.user.user_metadata || {}), 
        name: data.name || req.user.user_metadata?.name 
      } 
    };

    return res.json({ success: true, data: mergedData });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { email, name } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const updatePayload = {};
    if (email) updatePayload.email = email;
    if (name) {
      updatePayload.user_metadata = { ...(req.user.user_metadata || {}), name };
    }

    console.log("Saving profile...");

    // Update in users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ name, email })
      .eq('id', userId);
      
    if (dbError) {
      console.error('DB Update error:', dbError);
    }

    let returnedUser = { id: userId, email, user_metadata: { name } };

    if (supabase.auth.admin) {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, updatePayload);
      if (error) {
        // If DB update succeeded but auth update failed, log it but don't fail completely
        console.error('Auth Update error:', error);
      } else if (data && data.user) {
        returnedUser = data.user;
      }
    } else {
      console.warn('Profile updates via auth.admin are currently disabled (Admin client not initialized)');
    }

    return res.json({ success: true, data: returnedUser });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    // Verify current password first by attempting a login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    if (!supabase.auth.admin) {
      return res.status(500).json({ success: false, error: 'Password updates are currently disabled (Admin client not initialized)' });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });

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
    if (!supabase.auth.admin) {
      return res.status(500).json({ success: false, error: 'Account deletion is currently disabled (Admin client not initialized)' });
    }

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
