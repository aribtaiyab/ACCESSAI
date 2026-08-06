/**
 * FILE: routes/aiRoutes.js
 * 1. WHAT: AI tool routes.
 * 2. WHY:  Exposes AI features via API.
 * 3. HOW:  Used in server.js as app.use('/api', aiRoutes).
 *
 * Fix applied: Added AI-specific rate limiter (20 req/min) to all AI inference
 * endpoints to prevent Groq API key exhaustion.
 */
const express = require('express');
const router  = express.Router();
const aiController = require('../controllers/aiController');
const { aiLimiter } = require('../middleware/rateLimiter');
const { optionalAuth } = require('../middleware/authMiddleware');

// Apply AI rate limiter + optional auth to all AI routes
router.use(aiLimiter);
router.use(optionalAuth);

router.post('/chat',      aiController.chat);
router.post('/simplify',  aiController.simplify);
router.post('/explain',   aiController.explain);
router.post('/summarize', aiController.summarize);
router.post('/translate', aiController.translate);
router.post('/ask-page',  aiController.askPage);

module.exports = router;
