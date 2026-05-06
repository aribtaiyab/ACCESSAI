/**
 * FILE: controllers/orgController.js
 * 1. WHAT: Organizational accessibility auditing using Puppeteer and Axe-core.
 * 2. WHY: Audit entire websites for accessibility.
 * 3. HOW: Called by orgRoutes.js.
 */
const supabase = require('../lib/supabaseClient');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const saveHistory = async (userId, type, inputText, outputText) => {
  if (!supabase) return;
  try {
    await supabase.from('history').insert([{
      user_id: userId,
      type,
      input_text: inputText,
      output_text: outputText
    }]);
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

exports.runAudit = async (req, res) => {
  console.log("📋 [AUDIT] Request received");
  console.log("📋 [AUDIT] URL:", req.body?.url);
  console.log("📋 [AUDIT] User:", req.user?.id);
  
  let browser;
  try {
    const userId = req.user?.id;
    let { url } = req.body;

    if (!userId || !url) {
      console.error("❌ [AUDIT] Missing userId or URL");
      return res.status(400).json({ success: false, error: 'User ID and URL are required' });
    }

    // Add protocol if missing
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    console.log("✅ [AUDIT] Starting audit for URL:", url);

    // Launch puppeteer
    console.log("🚀 [AUDIT] Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log("✅ [AUDIT] Puppeteer launched successfully");

    const page = await browser.newPage();
    
    // Set timeout to 20s as requested
    await page.setDefaultNavigationTimeout(20000);
    console.log("✅ [AUDIT] Page created, timeout set to 20s");

    try {
      console.log("🔄 [AUDIT] Navigating to:", url);
      await page.goto(url, { waitUntil: 'networkidle2' });
      console.log("✅ [AUDIT] Page loaded successfully");
    } catch (err) {
      console.error("❌ [AUDIT] Failed to load page:", err.message);
      await browser.close();
      return res.status(400).json({ success: false, error: 'Could not reach the website. Please check the URL or try again later.' });
    }

    // Inject axe-core
    console.log("🔍 [AUDIT] Injecting axe-core...");
    const axeScript = fs.readFileSync(path.join(__dirname, '../node_modules/axe-core/axe.min.js'), 'utf8');
    await page.evaluate(axeScript);
    console.log("✅ [AUDIT] Axe-core injected");

    // Run axe
    console.log("🔍 [AUDIT] Running accessibility scan...");
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run();
    });
    console.log("✅ [AUDIT] Accessibility scan complete. Violations found:", results.violations.length);

    await browser.close();
    console.log("✅ [AUDIT] Browser closed");

    // Process results
    const violations = results.violations;
    
    let critical = 0;
    let serious = 0;
    let moderate = 0;
    let minor = 0;

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

    console.log(`📊 [AUDIT] Issues breakdown - Critical: ${critical}, Serious: ${serious}, Moderate: ${moderate}, Minor: ${minor}`);

    // Scoring System
    // score = 100 - (critical*10 + serious*5 + moderate*1)
    let score = 100 - (critical * 10 + serious * 5 + moderate * 1);
    if (score < 0) score = 0;

    // wcagLevel: 90+ AAA, 70+ AA, 50+ A, else Fail
    let wcagLevel = 'Fail';
    if (score >= 90) wcagLevel = 'AAA';
    else if (score >= 70) wcagLevel = 'AA';
    else if (score >= 50) wcagLevel = 'A';

    console.log(`📈 [AUDIT] Final Score: ${score}/100 (${wcagLevel})`);

    // Save to Supabase
    console.log("💾 [AUDIT] Saving results to database...");
    const { error: dbError } = await supabase
      .from('org_audits')
      .insert([{ 
        user_id: userId, 
        url, 
        score, 
        recommendations: issues.slice(0, 5).map(i => i.description), // Store top 5 as recommendations for legacy support
        issues: issues,
        wcag_level: wcagLevel,
        audited_at: new Date() 
      }]);

    if (dbError) {
      console.error('❌ [AUDIT] DB Error:', dbError);
    } else {
      console.log("✅ [AUDIT] Results saved to database");
    }

    // Save to history
    await saveHistory(userId, 'audit', url, `Score: ${score} (${wcagLevel}). Issues found: ${issues.length}`);
    console.log("✅ [AUDIT] History saved");

    console.log("✅ [AUDIT] Audit complete, sending response");
    return res.json({ 
      success: true, 
      data: { 
        score, 
        wcagLevel,
        issues: issues.slice(0, 20) // Return top 20 issues to avoid payload size issues
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
