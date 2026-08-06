/**
 * FILE: services/userService.js
 * 
 * 1. WHAT: User database operations, password hashing with bcrypt, validation.
 * 2. WHY: Centralizes user authentication and account management.
 * 3. HOW: Uses SQLite database queries and bcryptjs for secure hashing.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createUser = async ({ email, password, name = '' }) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedEmail = email.trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = trimmedEmail.toLowerCase();

  // Check duplicate email
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing) {
    const error = new Error('An account with this email already exists. Please sign in.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password using bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const sanitizedName = name && typeof name === 'string' && name.trim() ? name.trim() : normalizedEmail.split('@')[0];

  await db.run(
    `INSERT INTO users (id, email, password, name, created_at, updated_at) 
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [userId, normalizedEmail, hashedPassword, sanitizedName]
  );

  return {
    id: userId,
    email: normalizedEmail,
    name: sanitizedName,
    created_at: new Date().toISOString(),
  };
};

const validateUser = async ({ email, password }) => {
  if (!email || typeof email !== 'string' || !email.trim() || !password || typeof password !== 'string') {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedEmail = email.trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  
  if (!user) {
    const error = new Error('No account found. Please sign up first.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Incorrect password. Please try again.');
    error.statusCode = 401;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
  };
};

const getUserById = async (id) => {
  if (!id) return null;
  const user = await db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', [id]);
  return user || null;
};

const getUserByEmail = async (email) => {
  if (!email || typeof email !== 'string') return null;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get('SELECT id, email, name, created_at FROM users WHERE email = ?', [normalizedEmail]);
  return user || null;
};

const createPasswordResetToken = async (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email is required.');
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  
  if (!user) {
    const error = new Error('No account found with this email address.');
    error.statusCode = 404;
    throw error;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await db.run(
    `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
    [resetToken, expiry, user.id]
  );

  return resetToken;
};

const resetPasswordWithToken = async (token, newPassword) => {
  if (!token) {
    const error = new Error('Reset token is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const user = await db.get(
    `SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > datetime('now')`,
    [token]
  );

  if (!user) {
    const error = new Error('Invalid or expired reset token.');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.run(
    `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = datetime('now') WHERE id = ?`,
    [hashedPassword, user.id]
  );

  return { success: true };
};

module.exports = {
  createUser,
  validateUser,
  getUserById,
  getUserByEmail,
  createPasswordResetToken,
  resetPasswordWithToken,
};
