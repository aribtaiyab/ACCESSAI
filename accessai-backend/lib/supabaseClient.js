/**
 * FILE: lib/supabaseClient.js
 * 
 * 1. WHAT: Supabase admin client configuration for backend.
 * 2. WHY: Provides a reusable Supabase admin client for database and auth operations.
 * 3. HOW: Import and use in controllers with SERVICE ROLE KEY for admin operations.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('ERROR: Missing Supabase environment variables');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓ Set' : '✗ Missing');
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

if (!supabaseServiceRoleKey) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not set. History saving will be disabled.');
}

let supabase = null;

if (supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('✓ Supabase admin client initialized');
} else {
  console.warn('WARNING: Supabase admin client not initialized due to missing SERVICE_ROLE_KEY');
}

module.exports = supabase;
