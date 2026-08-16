import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load from current working directory or traverse to workspace root .env
dotenv.config();
if (typeof import.meta.dirname === 'string') {
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
}

const supabaseUrl =
  process.env.SUPABASE_PROJECT_URL ||
  process.env.VITE_SUPABASE_PROJECT_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_PUBLIC_KEY ||
  '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
