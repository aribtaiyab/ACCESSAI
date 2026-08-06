/**
 * FILE: controllers/historyController.js
 * 1. WHAT: Manage request history using SQLite database.
 * 2. WHY: Users can view, save, and delete their past AI requests.
 * 3. HOW: Called by historyRoutes.js.
 */

const crypto = require('crypto');
const db = require('../config/database');

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const rows = await db.all(
      'SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return res.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('❌ [HISTORY] Get history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get history' });
  }
};

exports.saveHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, input_text, output_text } = req.body;

    const input = input_text || req.body.input;
    const output = output_text || req.body.output;

    if (!userId || !type || !input || !output) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, type, input text, and output text are required' 
      });
    }

    const historyId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    await db.run(
      `INSERT INTO history (id, user_id, type, input, output, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [historyId, userId, type, input, output]
    );

    const savedRecord = {
      id: historyId,
      user_id: userId,
      type,
      input,
      output,
      created_at: new Date().toISOString(),
    };

    return res.json({ success: true, data: savedRecord });
  } catch (error) {
    console.error('❌ [HISTORY] Save history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to save history' });
  }
};

exports.deleteHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({ success: false, error: 'User ID and history ID are required' });
    }

    await db.run(
      'DELETE FROM history WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete history' });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await db.run(
      'DELETE FROM history WHERE user_id = ?',
      [userId]
    );

    return res.json({ success: true, message: 'All history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear history' });
  }
};
