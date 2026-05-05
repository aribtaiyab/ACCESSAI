/**
 * FILE: utils/mailer.js
 * 1. WHAT: Nodemailer setup.
 * 2. WHY: Send verification and reset emails.
 * 3. HOW: Used in authController.js.
 */
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({});
module.exports = transporter;
