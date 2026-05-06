const dotenv = require('dotenv');
dotenv.config();

// Validate environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('ERROR: Missing environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

console.log('✓ All environment variables loaded');
console.log('✓ Groq API Key: LOADED');
console.log('✓ Supabase Client: Ready');

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

// CORS configuration - Allow all origins for extension and local dev
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Rate limiter
app.use(rateLimiter);

// Timeout handling
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ result: "Error: Request timeout" });
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

// Mount routes with correct prefixes - CRITICAL for avoiding 404 errors
app.use('/api', aiRoutes);
app.use('/', aiRoutes); // Support extension calling /simplify directly
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'AccessAI Backend API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const startPort = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = () => {
  const server = app.listen(startPort, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✓ Server running on http://localhost:${startPort}`);
    console.log('✓ Database: Supabase');
    console.log('✓ Frontend: http://localhost:3000');
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
