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
router.post('/translate', aiController.translate);
router.post('/alt-text', aiController.altText);

module.exports = router;
