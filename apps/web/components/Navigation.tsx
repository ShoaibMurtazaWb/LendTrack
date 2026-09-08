// =============================================================================
// LendTrack :: Navigation Header Component
// apps/web/components/Navigation.tsx
// =============================================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth.js';
import { LogOut, User as UserIcon, RefreshCw, Layers } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { user, profile, signOut, loading } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="nav-header">
      <div className="nav-container flex-between">
        <Link href={user ? "/dashboard" : "/"} className="logo">
          <Layers className="text-gradient-primary" size={24} />
          <span>Lend<span className="text-gradient">Track</span></span>
        </Link>

        {!loading && (
          <>
            {user ? (
              <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <ul className="nav-menu">
                  <li>
                    <Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/loans" className={`nav-link ${isActive('/loans') ? 'active' : ''}`}>
                      Loans
                    </Link>
                  </li>
                  <li>
                    <Link href="/contacts" className={`nav-link ${isActive('/contacts') ? 'active' : ''}`}>
                      Contacts
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
                      Settings
                    </Link>
                  </li>
                </ul>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid var(--border-glass)', paddingLeft: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{profile?.full_name || user.email}</div>
                    <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'flex-end', gap: '4px', alignItems: 'center' }}>
                      <span className={`badge ${profile?.plan === 'premium' ? 'badge-returned' : 'badge-active'}`} style={{ padding: '2px 6px', fontSize: '9px' }}>
                        {profile?.plan || 'free'}
                      </span>
                    </div>
                  </div>

                  <button onClick={signOut} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} title="Sign Out">
                    <LogOut size={16} />
                  </button>
                </div>
              </nav>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                  Get Started
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
