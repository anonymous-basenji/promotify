import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

// The anon key is public (the frontend ships it too), so reuse the frontend's variable
const supabaseAnonKey = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_PUBLIC_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Promotify Backend: Missing required Supabase environment variables!\n' +
      `SUPABASE_URL / SUPABASE_PROJECT_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_PUBLIC_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`
  );
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// Only used to verify access tokens; never for data access
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Queries run as the signed-in user, so RLS policies apply
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...clientOptions,
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

const requestClient = new AsyncLocalStorage<SupabaseClient>();

export function runWithUserClient(client: SupabaseClient, fn: () => void): void {
  requestClient.run(client, fn);
}

// The current request's user client, set by requireAuth
export function db(): SupabaseClient {
  const client = requestClient.getStore();
  if (!client) {
    throw new Error('No Supabase client for this request (is requireAuth applied?)');
  }
  return client;
}
