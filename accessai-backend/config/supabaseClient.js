/**
 * FILE: config/supabaseClient.js
 * 
 * 1. WHAT: Supabase client configuration.
 * 2. WHY: Provides a reusable Supabase client for database and auth operations.
 * 3. HOW: Import and use in controllers.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase environment variables');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('  SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✓ Supabase client initialized');

module.exports = supabase;