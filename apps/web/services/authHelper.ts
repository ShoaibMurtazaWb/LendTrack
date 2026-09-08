// =============================================================================
// LendTrack :: Server-Side Auth Verification Helper
// apps/web/services/authHelper.ts
// =============================================================================

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAuthVerify = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAuthVerify.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('[authHelper] Error verifying token:', error);
    return null;
  }
}
