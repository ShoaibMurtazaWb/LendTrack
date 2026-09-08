// =============================================================================
// LendTrack :: Sign In Page
// apps/web/app/login/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth.js';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // If user is already authenticated, send them to the dashboard
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', width: '100%' }}>
      <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Sign in to manage your active loans
          </p>
        </div>

        {localError && (
          <div className="alert-banner" style={{ margin: 0, padding: '12px 16px' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '14px' }}>{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={localLoading}
          >
            {localLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign Up
          </Link>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          <p>Demo accounts details:</p>
          <p>john@example.com / password123</p>
          <p>jane@example.com / password123</p>
        </div>

      </div>
    </div>
  );
}
