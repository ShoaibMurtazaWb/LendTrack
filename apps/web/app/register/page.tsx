// =============================================================================
// LendTrack :: Registration Page
// apps/web/app/register/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth.js';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // If user is already authenticated, send them to the dashboard
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    try {
      await signUp(email, password, fullName);
      setIsSuccess(true);
      
      // Auto-redirect after signup if confirmation is disabled
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to register. User might already exist.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', width: '100%' }}>
      <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Start tracking lent items in under a minute
          </p>
        </div>

        {localError && (
          <div className="alert-banner" style={{ margin: 0, padding: '12px 16px' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '14px' }}>{localError}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0', textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: '20px' }}>Registration Successful!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Redirecting you to the sign in page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                required
              />
            </div>

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
                placeholder="At least 6 characters"
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
                  <span>Registering...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', fontSize: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
