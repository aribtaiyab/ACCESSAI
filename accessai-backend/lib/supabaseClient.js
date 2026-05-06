/**
 * FILE: lib/supabaseClient.js
 * 
 * 1. WHAT: Supabase client configuration for backend.
 * 2. WHY: Provides a reusable Supabase client for database and auth operations.
 * 3. HOW: Uses SERVICE_ROLE_KEY for admin operations, falls back to ANON_KEY for basic connectivity.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('ERROR: Missing Supabase environment variables');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  throw new Error('Missing Supabase URL. Check your .env file.');
}

// Determine which key to use. Service role is preferred for backend admin tasks.
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error('ERROR: No Supabase keys found (SERVICE_ROLE_KEY or ANON_KEY)');
  throw new Error('Missing Supabase keys. Check your .env file.');
}

if (!supabaseServiceRoleKey) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Falling back to ANON_KEY.');
  console.warn('  -> Note: Admin operations (like direct password updates or bypassing RLS) may fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (supabaseServiceRoleKey) {
  console.log('✓ Supabase client initialized with SERVICE_ROLE_KEY (Admin Mode)');
} else {
  console.log('✓ Supabase client initialized with ANON_KEY (Standard Mode)');
}

module.exports = supabase;
