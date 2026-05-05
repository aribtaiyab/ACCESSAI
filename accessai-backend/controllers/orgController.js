/**
 * FILE: controllers/orgController.js
 * 1. WHAT: Organizational accessibility auditing.
 * 2. WHY: Audit entire websites for accessibility.
 * 3. HOW: Called by orgRoutes.js.
 */
const supabase = require('../lib/supabaseClient');

exports.runAudit = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { url } = req.body;

    if (!userId || !url) {
      return res.status(400).json({ success: false, error: 'User ID and URL are required' });
    }

    // Placeholder audit logic - replace with actual auditing service
    const score = Math.floor(Math.random() * 50) + 50; // Random score between 50-100
    const recommendations = ['Add alt text to images', 'Use semantic HTML', 'Ensure color contrast'];

    const { data, error } = await supabase
      .from('org_audits')
      .insert([{ user_id: userId, url, score, recommendations, audited_at: new Date() }]);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: { score, recommendations } });
  } catch (error) {
    console.error('Run audit error:', error);
    return res.status(500).json({ success: false, error: 'Failed to run audit' });
  }
};

exports.getAudits = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('org_audits')
      .select('*')
      .eq('user_id', userId)
      .order('audited_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get audits error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get audits' });
  }
};
