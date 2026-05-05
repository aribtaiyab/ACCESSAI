/**
 * FILE: controllers/historyController.js
 * 1. WHAT: Manage request history using Supabase.
 * 2. WHY: Users can view and delete their past AI requests.
 * 3. HOW: Called by historyRoutes.js.
 */

const supabase = require('../lib/supabaseClient');

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get history' });
  }
};

exports.saveHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, input_text, output_text } = req.body;

    if (!userId || !type || !input_text || !output_text) {
      return res.status(400).json({ success: false, error: 'User ID, type, input text, and output text are required' });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const { data, error } = await supabase
      .from('history')
      .insert([{ user_id: userId, type, input_text, output_text }]);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Save history error:', error);
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

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const { error } = await supabase
      .from('history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

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

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const { error } = await supabase
      .from('history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'All history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear history' });
  }
};
