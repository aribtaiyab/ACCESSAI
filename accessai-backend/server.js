const dotenv = require('dotenv');
dotenv.config();

// Validate critical environment variables at startup
const requiredEnvVars = ['GROQ_API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('  Please check your .env file or deployment environment settings.');
  process.exit(1);
}

console.log('✓ All required environment variables loaded');
console.log('✓ Groq API Key: LOADED');
console.log('✓ Auth: JWT + SQLite (production mode)');

/**
 * FILE: server.js
 *
 * 1. WHAT: Entry point for the AccessAI Express backend.
 * 2. WHY:  Initializes the server with middleware, routes, and error handling.
 * 3. HOW:  Run with `npm start` or `npm run dev`.
 *
 * Fixes applied:
 *   - Removed app.use('/', aiRoutes) duplicate root mount (Bug #3)
 *   - Removed hardcoded localhost from allowedOrigins (Bug #6)
 *   - Replaced res.setTimeout (no-op) with proper request timeout (Bug #13)
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const app         = express();
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Security middleware
app.use(helmet());

// ── CORS Configuration ────────────────────────────────────────────────────────
// FIX: Removed hardcoded localhost entries from production allowedOrigins.
// Local development origins can be added via CORS_ORIGIN env variable.
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const PRODUCTION_ORIGINS = [
  'https://accessai-frontend.vercel.app',
];

const allowedOrigins = [...new Set([...PRODUCTION_ORIGINS, ...configuredOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);

    const isChromeExtension = origin.startsWith('chrome-extension://') ||
                              origin.startsWith('moz-extension://');
    const isVercelApp       = origin === 'https://accessai-frontend.vercel.app' ||
                              (typeof origin === 'string' && origin.endsWith('.vercel.app'));
    const isAllowedExplicit = allowedOrigins.includes(origin);

    if (isChromeExtension || isVercelApp || isAllowedExplicit) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle all preflight OPTIONS requests

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// ── Global Rate Limiter ───────────────────────────────────────────────────────
app.use(rateLimiter);

// ── Request Timeout ───────────────────────────────────────────────────────────
// FIX: res.setTimeout is a no-op on Express responses. Use socket timeout instead.
const REQUEST_TIMEOUT_MS = 35000; // 35s (Groq API calls can take up to 30s)
app.use((req, res, next) => {
  req.socket.setTimeout(REQUEST_TIMEOUT_MS);
  req.socket.once('timeout', () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timed out. The AI service may be busy — please try again.',
        result: 'Request timed out. The AI service may be busy — please try again.',
      });
    }
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
const aiRoutes       = require('./routes/aiRoutes');
const authRoutes     = require('./routes/authRoutes');
const historyRoutes  = require('./routes/historyRoutes');
const orgRoutes      = require('./routes/orgRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes     = require('./routes/userRoutes');
const intentRoutes   = require('./routes/intentRoutes');
const companionRoutes = require('./routes/companionRoutes');

// FIX: Removed app.use('/', aiRoutes) — this duplicated AI routes at root level
// and conflicted with the health check endpoint. All AI routes are at /api/*.
app.use('/api',            aiRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/history',    historyRoutes);
app.use('/api/org',        orgRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/user',       userRoutes);
app.use('/api',            intentRoutes);
app.use('/api/companion',  companionRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'AccessAI is ready to help!' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "That endpoint doesn't exist." });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server Startup ────────────────────────────────────────────────────────────
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`✓ AccessAI backend listening on port ${PORT}`);
  console.log('✓ Database: SQLite (persistent)');
  console.log('✓ Auth: JWT (stateless)');
  console.log('✓ CORS: production configured');
  console.log('='.repeat(50) + '\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Please free the port and restart.\n`);
    process.exit(1);
  }
  console.error('❌ Server error:', error.message);
  process.exit(1);
});
