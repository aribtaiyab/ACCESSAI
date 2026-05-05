/**
 * FILE: controllers/settingsController.js
 * 1. WHAT: User settings management using Supabase.
 * 2. WHY: Sync user preferences across devices.
 * 3. HOW: Called by settingsRoutes.js.
 */

const supabase = require('../lib/supabaseClient');

exports.getSettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || {} });
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

    const { data, error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};
