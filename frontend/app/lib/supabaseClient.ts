import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_PROJECT_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY || '').trim();

if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Promotify One: Supabase configuration missing!\n' +
      `VITE_SUPABASE_PROJECT_URL: ${supabaseUrl ? 'FOUND' : 'MISSING / EMPTY'}\n` +
      `VITE_SUPABASE_ANON_PUBLIC_KEY: ${supabaseAnonKey ? 'FOUND' : 'MISSING / EMPTY'}\n` +
      'Please check your .env file in project root.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
