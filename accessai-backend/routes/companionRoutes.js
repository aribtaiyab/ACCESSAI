/**
 * FILE: routes/companionRoutes.js
 * 1. WHAT: Route definitions for AccessAI Internet Companion.
 * 2. WHY:  Isolated from all existing routes — zero disturbance to working features.
 * 3. HOW:  Mounted in server.js under /api/companion.
 */
const express    = require('express');
const router     = express.Router();
const companion  = require('../controllers/companionController');

router.post('/analyze', companion.analyze);
router.post('/chat',    companion.chat);

module.exports = router;
