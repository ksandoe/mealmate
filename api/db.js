// Supabase client for the MealMate API.
// Uses the service role key so the server can read/write all tables;
// RLS stays enabled (see db/03_policies.sql) so the client app can
// never touch Supabase directly.

const path = require('path');
require('dotenv').config({ path: [
  path.join(__dirname, '.env'),        // api/.env: SUPABASE_SECRET_KEY
  path.join(__dirname, '..', '.env')   // root .env: VITE_SUPABASE_URL fallback
] });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    'Missing Supabase config. Set SUPABASE_URL (or VITE_SUPABASE_URL) ' +
    'and SUPABASE_SECRET_KEY in api/.env - see api/README.md'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

module.exports = supabase;
