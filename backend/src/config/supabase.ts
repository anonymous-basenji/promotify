import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load from current working directory or traverse to workspace root .env
dotenv.config();
if (typeof import.meta.dirname === 'string') {
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
}

let supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.VITE_SUPABASE_PROJECT_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_PUBLIC_KEY ||
  process.env.SUPABASE_ANON_PUBLIC_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Promotify Backend: Supabase credentials missing from environment variables!\n' +
      `URL: ${supabaseUrl ? 'FOUND' : 'MISSING'}\n` +
      `KEY: ${supabaseKey ? 'FOUND' : 'MISSING'}`
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
