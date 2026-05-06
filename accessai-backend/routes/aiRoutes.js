/**
 * FILE: routes/aiRoutes.js
 * 1. WHAT: AI tool routes.
 * 2. WHY: Exposes AI features via API.
 * 3. HOW: Used in server.js.
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/chat', aiController.chat);
router.post('/simplify', aiController.simplify);
router.post('/explain', aiController.explain);
router.post('/summarize', aiController.summarize);
router.post('/translate', aiController.translate);

module.exports = router;
