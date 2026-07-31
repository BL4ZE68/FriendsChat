import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Only instantiate when credentials are provided; every call-site already
// guards with `if (SUPABASE_ENABLED)` before touching `supabase`.
export const supabase = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (null as unknown as ReturnType<typeof createClient>);

export default supabase;
