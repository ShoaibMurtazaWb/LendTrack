// =============================================================================
// LendTrack :: Supabase Admin Client (Web Server)
// apps/web/services/supabaseAdmin.ts
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  throw new Error('[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabaseServiceKey) {
  console.warn('[Supabase Admin] Warning: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations may fail.');
}

// Admin client bypasses RLS policies. 
// Used only on server-side Next.js route handlers.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
export default supabaseAdmin;
