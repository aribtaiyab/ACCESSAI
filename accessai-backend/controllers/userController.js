/**
 * FILE: controllers/userController.js
 * 1. WHAT: User profile management using persistent SQLite database and bcrypt.
 * 2. WHY: Allows authenticated users to view/update profile, change password, and delete account.
 * 3. HOW: Called by userRoutes.js with authMiddleware.
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await db.get(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: user });
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

    const current = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const newEmail = email ? email.trim().toLowerCase() : current.email;
    const newName = name !== undefined ? name.trim() : current.name;

    // Check if new email conflicts with another user
    if (newEmail !== current.email) {
      const existing = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, userId]);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email is already in use by another account.' });
      }
    }

    await db.run(
      'UPDATE users SET email = ?, name = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [newEmail, newName, userId]
    );

    const updatedUser = {
      id: userId,
      email: newEmail,
      name: newName,
      created_at: current.created_at,
    };

    return res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current and new password are required.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 6 characters long.' 
      });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run(
      'UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [hashedPassword, userId]
    );

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [userId]);

    return res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete account.' });
  }
};
