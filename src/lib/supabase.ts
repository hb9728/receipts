import { createClient } from '@supabase/supabase-js';

export const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// server-only client with service role (bypasses RLS). NEVER import client-side.
export function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
