const dotenv = require('dotenv');
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['GROQ_API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

console.log('✓ All required environment variables loaded');
console.log('✓ Groq API Key: LOADED');
console.log('✓ Auth: JWT + SQLite (production mode)');

/**
 * FILE: server.js
 * 
 * 1. WHAT: Entry point for the AccessAI Express backend.
 * 2. WHY: To initialize the server and setup global middleware and routes.
 * 3. HOW: Run with `npm start` or `npm run dev`.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Security middleware
app.use(helmet());

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  'https://accessai-frontend.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  ...configuredOrigins,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isChromeExtensionOrigin = origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://');
    const isVercelOrigin = typeof origin === 'string' && (origin === 'https://accessai-frontend.vercel.app' || origin.endsWith('.vercel.app'));
    const isAllowedOrigin = allowedOrigins.includes(origin) || isChromeExtensionOrigin || isVercelOrigin;

    if (isAllowedOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Rate limiter
app.use(rateLimiter);

// Timeout handling
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ result: "Sorry, that took too long. Please try again!" });
    }
  });
  next();
});

// Import routes
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');
const orgRoutes = require('./routes/orgRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const intentRoutes    = require('./routes/intentRoutes');    // AI Reading Assistant route
const companionRoutes = require('./routes/companionRoutes'); // Internet Companion — NEW, isolated

// Mount routes with correct prefixes - CRITICAL for avoiding 404 errors
app.use('/api', aiRoutes);
app.use('/', aiRoutes); // Support extension calling /simplify directly
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', userRoutes);
app.use('/api', intentRoutes);              // AI Reading Assistant route
app.use('/api/companion', companionRoutes); // Internet Companion — isolated

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'AccessAI is ready to help!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "I couldn't find that page!" });
});

// Global error handler
app.use(errorHandler);

const startPort = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = () => {
  const server = app.listen(startPort, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✓ Server listening on port ${startPort}`);
    console.log('✓ Database: SQLite (local persistent)');
    console.log('✓ Auth: JWT (stateless tokens)');
    console.log('✓ Frontend: configured via environment variables');
    console.log('='.repeat(50) + '\n');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n✗ ERROR: Port ${startPort} is already in use.`);
      console.error(`  Please close the process using this port and restart.\n`);
      process.exit(1);
    }
    console.error('✗ Server error:', error.message);
    process.exit(1);
  });
};

startServer();
