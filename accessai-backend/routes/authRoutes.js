/**
 * FILE: routes/authRoutes.js
 * 
 * 1. WHAT: Defines the API endpoints for authentication.
 * 2. WHY: Maps URLs to the appropriate controller functions.
 * 3. HOW: Included in server.js via app.use('/api/auth', authRoutes).
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);

// Protected routes
router.get('/session', authMiddleware, authController.getSession);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
