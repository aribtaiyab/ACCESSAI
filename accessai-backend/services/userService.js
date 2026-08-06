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
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new Error('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check duplicate email
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing) {
    throw new Error('An account with this email already exists. Please sign in.');
  }

  // Hash password using bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const sanitizedName = name ? name.trim() : normalizedEmail.split('@')[0];

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
  if (!email || !password) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  
  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null;
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
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get('SELECT id, email, name, created_at FROM users WHERE email = ?', [normalizedEmail]);
  return user || null;
};

const createPasswordResetToken = async (email) => {
  if (!email) throw new Error('Email is required.');
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  
  if (!user) {
    throw new Error('No user found with this email address.');
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
  if (!token) throw new Error('Reset token is required.');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const user = await db.get(
    `SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > datetime('now')`,
    [token]
  );

  if (!user) {
    throw new Error('Invalid or expired reset token.');
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
