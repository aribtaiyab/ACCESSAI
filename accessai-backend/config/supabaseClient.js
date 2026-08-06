/**
 * FILE: config/supabaseClient.js
 * 
 * 1. WHAT: Supabase client configuration (legacy fallback only).
 * 2. WHY: Some controllers originally used Supabase. Now the app uses SQLite.
 *         This file provides a safe no-op stub if Supabase is not configured/reachable.
 * 3. HOW: Returns a real client if env vars are valid, or a safe stub that never throws.
 */

let supabase;

try {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
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
  } else {
    throw new Error('Missing Supabase credentials');
  }
} catch (err) {
  console.warn('⚠ Supabase client not initialized (using SQLite fallback):', err.message);

  // Safe no-op stub — never throws, always returns graceful failure
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }), single: () => Promise.resolve({ data: null, error: null }) }), single: () => Promise.resolve({ data: null, error: null }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      admin: null,
    },
  };
}

module.exports = supabase;
