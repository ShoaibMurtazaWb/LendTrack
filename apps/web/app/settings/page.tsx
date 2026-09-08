// =============================================================================
// LendTrack :: Settings & Billing Console
// apps/web/app/settings/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth.js';
import { apiClient } from '../../services/apiClient.js';
import { 
  Sparkles, 
  Mail, 
  User, 
  Shield, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emailReminders, setEmailReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setEmailReminders(profile.notification_prefs?.email_reminders ?? true);
      setWeeklyDigest(profile.notification_prefs?.weekly_digest ?? false);
    }
  }, [profile]);

  // Handle URL callback triggers for Billing (mock or real stripe)
  useEffect(() => {
    const handleUrlRedirects = async () => {
      const mockUpgrade = searchParams.get('billing_mock_upgrade');
      const billingStatus = searchParams.get('billing_status');

      if (mockUpgrade === 'true') {
        setBillingLoading(true);
        try {
          await apiClient.mockUpgrade();
          setSuccessMessage('Successfully upgraded to Premium via mock checkout!');
          await refreshProfile();
          router.replace('/settings');
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to auto-upgrade in mock mode.');
        } finally {
          setBillingLoading(false);
        }
      }

      if (billingStatus === 'success') {
        setSuccessMessage('Stripe Checkout completed successfully! Refreshing details...');
        await refreshProfile();
        router.replace('/settings');
      } else if (billingStatus === 'cancel') {
        setErrorMessage('Stripe Checkout was cancelled.');
        router.replace('/settings');
      }
    };

    if (user && !authLoading) {
      handleUrlRedirects();
    }
  }, [searchParams, user, authLoading, router, refreshProfile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin text-gradient-primary" size={36} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading preferences panel...</p>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient.updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        notification_prefs: {
          email_reminders: emailReminders,
          weekly_digest: weeklyDigest,
        },
      });
      setSuccessMessage('Preferences updated successfully.');
      await refreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpgradeOrManage = async () => {
    setBillingLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (profile?.plan === 'premium') {
        // Customer portal
        const res = await apiClient.createPortalSession();
        window.location.href = res.url;
      } else {
        // Checkout session
        const res = await apiClient.createCheckoutSession();
        window.location.href = res.url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Stripe request failed. Make sure your ports are open.');
      setBillingLoading(false);
    }
  };

  const handleMockUpgrade = async () => {
    setBillingLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await apiClient.mockUpgrade();
      setSuccessMessage('Demo Account: Upgraded to Premium successfully.');
      await refreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed mock upgrade.');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleMockDowngrade = async () => {
    setBillingLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await apiClient.mockDowngrade();
      setSuccessMessage('Demo Account: Downgraded to Free plan.');
      await refreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed mock downgrade.');
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Control Panel</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details, reminder metrics, and subscriptions.</p>
      </div>

      {successMessage && (
        <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0' }}>
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert-banner">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Profile Settings */}
        <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px' }}>User Details</h2>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="text"
                className="form-input"
                value={user.email}
                disabled
                style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              />
            </div>

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
              <label className="form-label" htmlFor="avatarUrl">Avatar Photo URL</label>
              <input
                id="avatarUrl"
                type="text"
                className="form-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* Notification Preference toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <Mail size={16} />
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Preferences</h3>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailReminders}
                  onChange={(e) => setEmailReminders(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Receive daily due & overdue alerts</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Receive weekly digest email summary</span>
              </label>

            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Preferences'
              )}
            </button>

          </form>
        </div>

        {/* Subscription Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <CreditCard size={18} style={{ color: 'var(--secondary)' }} />
              <h2 style={{ fontSize: '18px' }}>Billing & Pricing</h2>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Current Tier</span>
                <div style={{ fontSize: '24px', fontWeight: 800, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {profile?.plan || 'free'}
                  {profile?.plan === 'premium' && <Sparkles size={20} style={{ color: '#c084fc' }} />}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</span>
                <span className={`badge ${profile?.plan === 'premium' ? 'badge-returned' : 'badge-active'}`}>
                  {profile?.plan === 'premium' ? 'Subscription Active' : 'Basic Account'}
                </span>
              </div>
            </div>

            {/* Standard actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleUpgradeOrManage} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px' }}
                disabled={billingLoading}
              >
                {billingLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing...</span>
                  </>
                ) : (
                  profile?.plan === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium ($5/mo)'
                )}
              </button>
            </div>

          </div>

          {/* Local testing tools block (Mock buttons) */}
          <div className="glass-panel-static" style={{ border: '1px dashed var(--border-glass-glow)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: '#c084fc' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Local Testing Console</h3>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Use these buttons to instantly trigger plans state upgrades/downgrades on your local database without inputting credit cards.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleMockUpgrade} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '8px', fontSize: '13px', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--success)' }}
                disabled={billingLoading}
              >
                Mock Upgrade
              </button>
              <button 
                onClick={handleMockDowngrade} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '8px', fontSize: '13px', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)' }}
                disabled={billingLoading}
              >
                Mock Downgrade
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
