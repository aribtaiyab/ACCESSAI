/**
 * FILE: routes/intentRoutes.js
 * 1. WHAT: Route definition for POST /api/reading-assistant.
 * 2. WHY:  Isolated from existing aiRoutes.js — zero impact on existing features.
 * 3. HOW:  Mounted in server.js under /api.
 */
const express = require('express');
const router = express.Router();
const { analyzeReadingAssistant } = require('../controllers/intentController');

router.post('/reading-assistant', analyzeReadingAssistant);

module.exports = router;
