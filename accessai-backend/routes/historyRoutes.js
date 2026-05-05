/**
 * FILE: routes/historyRoutes.js
 * 1. WHAT: History management routes.
 * 2. WHY: Endpoint for history CRUD operations.
 * 3. HOW: Used in server.js.
 * 
 * CRITICAL: /all route MUST be registered BEFORE /:id to avoid Express matching "all" as an ID
 */
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, historyController.getHistory);
router.post('/save', authMiddleware, historyController.saveHistory);
router.delete('/all', authMiddleware, historyController.clearHistory);
router.delete('/:id', authMiddleware, historyController.deleteHistory);

module.exports = router;
