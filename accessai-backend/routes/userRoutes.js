/**
 * FILE: routes/userRoutes.js
 * 1. WHAT: User profile and account management routes.
 * 2. WHY: API for profile, password, and account operations.
 * 3. HOW: Used in server.js as app.use('/api/user', userRoutes).
 * 
 * All routes protected by authMiddleware - user must be logged in.
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.updatePassword);
router.delete('/account', authMiddleware, userController.deleteAccount);

module.exports = router;
