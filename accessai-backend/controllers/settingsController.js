/**
 * FILE: controllers/settingsController.js
 * 1. WHAT: User settings management using SQLite database.
 * 2. WHY: Sync user preferences across devices.
 * 3. HOW: Called by settingsRoutes.js.
 */

const db = require('../config/database');

// Ensure settings table exists
db.db.serialize(() => {
  db.db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      font_size TEXT DEFAULT 'medium',
      dyslexia_mode INTEGER DEFAULT 0,
      high_contrast INTEGER DEFAULT 0,
      reading_mode TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating settings table:', err.message);
    else console.log('✓ Settings table ready');
  });
  db.db.run('CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id)');
});

exports.getSettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const row = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId]);
    return res.json({ success: true, data: row || {} });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const crypto = require('crypto');
    const settingsId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    // Build dynamic update fields
    const allowedFields = ['font_size', 'dyslexia_mode', 'high_contrast', 'reading_mode'];
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const existing = await db.get('SELECT id FROM settings WHERE user_id = ?', [userId]);

    if (existing) {
      // Update
      const setClause = fields.map(f => `${f} = ?`).join(', ') + ", updated_at = datetime('now')";
      const values = fields.map(f => updates[f]);
      values.push(userId);
      await db.run(`UPDATE settings SET ${setClause} WHERE user_id = ?`, values);
    } else {
      // Insert
      const columns = ['id', 'user_id', ...fields, 'created_at', 'updated_at'].join(', ');
      const placeholders = ['?', '?', ...fields.map(() => '?'), "datetime('now')", "datetime('now')"].join(', ');
      const values = [settingsId, userId, ...fields.map(f => updates[f])];
      await db.run(`INSERT INTO settings (${columns}) VALUES (${placeholders})`, values);
    }

    const updated = await db.get('SELECT * FROM settings WHERE user_id = ?', [userId]);
    return res.json({ success: true, data: updated || {} });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};
