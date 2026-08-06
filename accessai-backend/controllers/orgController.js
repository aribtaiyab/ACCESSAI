/**
 * FILE: controllers/orgController.js
 * 1. WHAT: Organizational accessibility auditing using Puppeteer and Axe-core.
 * 2. WHY: Audit entire websites for accessibility.
 * 3. HOW: Called by orgRoutes.js. Uses SQLite for persistence.
 */
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Ensure org_audits table exists
db.db.serialize(() => {
  db.db.run(`
    CREATE TABLE IF NOT EXISTS org_audits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      score INTEGER NOT NULL,
      wcag_level TEXT NOT NULL,
      issues TEXT NOT NULL,
      recommendations TEXT,
      audited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating org_audits table:', err.message);
    else console.log('✓ Org audits table ready');
  });
  db.db.run('CREATE INDEX IF NOT EXISTS idx_org_audits_user ON org_audits(user_id)');
});

const saveAuditHistory = async (userId, type, inputText, outputText) => {
  if (!userId) return;
  try {
    const historyId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    await db.run(
      `INSERT INTO history (id, user_id, type, input, output, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [historyId, userId, type, inputText, outputText]
    );
  } catch (error) {
    console.error('Failed to save history:', error.message);
  }
};

exports.runAudit = async (req, res) => {
  console.log('📋 [AUDIT] Request received');
  console.log('📋 [AUDIT] URL:', req.body?.url);
  console.log('📋 [AUDIT] User:', req.user?.id);

  let browser;
  try {
    const userId = req.user?.id;
    let { url } = req.body;

    if (!userId || !url) {
      console.error('❌ [AUDIT] Missing userId or URL');
      return res.status(400).json({ success: false, error: 'User ID and URL are required' });
    }

    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    console.log('✅ [AUDIT] Starting audit for URL:', url);

    console.log('🚀 [AUDIT] Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ [AUDIT] Puppeteer launched successfully');

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(20000);
    console.log('✅ [AUDIT] Page created, timeout set to 20s');

    try {
      console.log('🔄 [AUDIT] Navigating to:', url);
      await page.goto(url, { waitUntil: 'networkidle2' });
      console.log('✅ [AUDIT] Page loaded successfully');
    } catch (err) {
      console.error('❌ [AUDIT] Failed to load page:', err.message);
      await browser.close();
      return res.status(400).json({ success: false, error: 'Could not reach the website. Please check the URL or try again later.' });
    }

    console.log('🔍 [AUDIT] Injecting axe-core...');
    const axeScript = fs.readFileSync(path.join(__dirname, '../node_modules/axe-core/axe.min.js'), 'utf8');
    await page.evaluate(axeScript);
    console.log('✅ [AUDIT] Axe-core injected');

    console.log('🔍 [AUDIT] Running accessibility scan...');
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run();
    });
    console.log('✅ [AUDIT] Accessibility scan complete. Violations found:', results.violations.length);

    await browser.close();
    console.log('✅ [AUDIT] Browser closed');

    const violations = results.violations;

    let critical = 0, serious = 0, moderate = 0, minor = 0;

    const issues = violations.map(v => {
      if (v.impact === 'critical') critical++;
      if (v.impact === 'serious') serious++;
      if (v.impact === 'moderate') moderate++;
      if (v.impact === 'minor') minor++;

      return {
        rule: v.id,
        description: v.description,
        severity: v.impact,
        element: v.nodes[0]?.html || 'Multiple elements',
        fix: v.help + '. ' + v.helpUrl
      };
    });

    console.log(`📊 [AUDIT] Issues - Critical: ${critical}, Serious: ${serious}, Moderate: ${moderate}, Minor: ${minor}`);

    let score = 100 - (critical * 10 + serious * 5 + moderate * 1);
    if (score < 0) score = 0;

    let wcagLevel = 'Fail';
    if (score >= 90) wcagLevel = 'AAA';
    else if (score >= 70) wcagLevel = 'AA';
    else if (score >= 50) wcagLevel = 'A';

    console.log(`📈 [AUDIT] Final Score: ${score}/100 (${wcagLevel})`);

    // Save to SQLite
    console.log('💾 [AUDIT] Saving results to database...');
    const auditId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    try {
      await db.run(
        `INSERT INTO org_audits (id, user_id, url, score, wcag_level, issues, recommendations, audited_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          auditId,
          userId,
          url,
          score,
          wcagLevel,
          JSON.stringify(issues),
          JSON.stringify(issues.slice(0, 5).map(i => i.description))
        ]
      );
      console.log('✅ [AUDIT] Results saved to database');
    } catch (dbErr) {
      console.error('❌ [AUDIT] DB Error:', dbErr.message);
    }

    await saveAuditHistory(userId, 'audit', url, `Score: ${score} (${wcagLevel}). Issues found: ${issues.length}`);
    console.log('✅ [AUDIT] History saved');

    return res.json({
      success: true,
      data: {
        score,
        wcagLevel,
        issues: issues.slice(0, 20)
      }
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ [AUDIT] Run audit error:', error);
    return res.status(500).json({ success: false, error: 'Accessibility scan failed. The site might be blocking automated tools.' });
  }
};

exports.getAudits = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const rows = await db.all(
      'SELECT * FROM org_audits WHERE user_id = ? ORDER BY audited_at DESC',
      [userId]
    );

    // Parse JSON fields
    const parsed = rows.map(row => ({
      ...row,
      issues: (() => { try { return JSON.parse(row.issues); } catch { return []; } })(),
      recommendations: (() => { try { return JSON.parse(row.recommendations); } catch { return []; } })(),
    }));

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Get audits error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get audits' });
  }
};
