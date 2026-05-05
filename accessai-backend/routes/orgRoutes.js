/**
 * FILE: routes/orgRoutes.js
 * 1. WHAT: Organizational accessibility audit routes.
 * 2. WHY: API for running and viewing website audits.
 * 3. HOW: Used in server.js as app.use('/api/org', orgRoutes).
 * 
 * All routes protected by authMiddleware - user must be logged in.
 */
const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/audit', authMiddleware, orgController.runAudit);
router.get('/audits', authMiddleware, orgController.getAudits);

module.exports = router;
