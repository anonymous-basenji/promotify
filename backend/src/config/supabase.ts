import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load from current working directory or traverse to workspace root .env
dotenv.config();
if (typeof import.meta.dirname === 'string') {
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
}

let supabaseUrl = (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || '').trim();

if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Promotify Backend: Missing required Supabase environment variables!\n' +
      `SUPABASE_URL / SUPABASE_PROJECT_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'SET' : 'MISSING'}`
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
