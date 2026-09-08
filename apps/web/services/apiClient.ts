// =============================================================================
// LendTrack :: Local Billing API Client Wrapper
// apps/web/services/apiClient.ts
// =============================================================================

import { supabase } from './supabaseClient.js';
import { ApiResponse } from '@lendtrack/shared-types';

const apiBaseUrl = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const sessionRes = await supabase.auth.getSession();
  const token = sessionRes.data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success || json.error) {
    const errorObj = json.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred.' };
    throw errorObj;
  }

  return json.data as T;
}

export const apiClient = {
  // --- Billing (Stripe) ---
  createCheckoutSession: () => request<{ url: string; sessionId: string }>('/billing/checkout', { method: 'POST' }),
  createPortalSession: () => request<{ url: string }>('/billing/portal', { method: 'POST' }),
  mockUpgrade: () => request<any>('/billing/mock-billing?action=upgrade', { method: 'POST' }),
  mockDowngrade: () => request<any>('/billing/mock-billing?action=downgrade', { method: 'POST' }),
};
