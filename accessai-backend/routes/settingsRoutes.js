/**
 * FILE: routes/settingsRoutes.js
 * 1. WHAT: Settings management routes.
 * 2. WHY: CRUD for user settings like font size, dyslexia mode, etc.
 * 3. HOW: Used in server.js as app.use('/api/settings', settingsRoutes).
 * 
 * All routes protected by authMiddleware - user must be logged in.
 */
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, settingsController.getSettings);
router.put('/', authMiddleware, settingsController.updateSettings);

module.exports = router;
