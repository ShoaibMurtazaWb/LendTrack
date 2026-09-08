// =============================================================================
// LendTrack :: Marketing Landing Page
// apps/web/app/page.tsx
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { Layers, ShieldCheck, Mail, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', padding: '40px 0' }}>
      
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, color: '#818cf8', width: 'fit-content', margin: '0 auto' }}>
          <Zap size={14} />
          <span>Track and coordinate personal lending effortlessly</span>
        </div>
        <h1 style={{ fontSize: '54px', fontWeight: 800, lineHeight: 1.1 }}>
          Never lose track of your <span className="text-gradient">lent items</span> again.
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          LendTrack is a premium platform designed to log items and tools you lend to or borrow from neighbors, friends, and family. We send automated email alerts before and on due dates so you don't have to follow up manually.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px' }}>Smart features for modern lending</h2>
        
        <div className="grid-responsive">
          <div className="glass-panel">
            <div style={{ background: 'var(--primary-glow)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>Unified Inventory</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Track tools, camping gear, books, board games, or kitchen appliances in a single clear register. Upload item details and custom categories.
            </p>
          </div>

          <div className="glass-panel">
            <div style={{ background: 'var(--primary-glow)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
              <Mail size={24} />
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>Automated Reminders</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              We track expected return dates and trigger gentle notification emails to both parties. Supports pre-due alerts and daily overdue reminders.
            </p>
          </div>

          <div className="glass-panel">
            <div style={{ background: 'var(--primary-glow)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>Soft Deletion & Audit</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Maintain historical audit logs of previous loans and reminder outputs. Retain contact cards safely with local privacy defaults and soft deletes.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px' }}>Choose your plan</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          
          {/* Free Plan */}
          <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            <div>
              <h3 style={{ fontSize: '24px' }}>Free</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Perfect for tracking a few items occasionally</p>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800 }}>$0 <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text-secondary)' }}>/ forever</span></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Up to 5 active loans</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Track unlimited inventory items</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Add unlimited contacts</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Standard dashboard metrics</span>
              </li>
            </ul>
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <Link href="/register" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
                Sign Up Free
              </Link>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', border: '1.5px solid var(--primary)' }}>
            <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recommended
            </div>
            <div>
              <h3 style={{ fontSize: '24px' }}>Premium</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>For power users who share items regularly</p>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800 }}>$5 <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text-secondary)' }}>/ month</span></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: '#c084fc' }} />
                <span style={{ fontWeight: 600 }}>Unlimited active loans</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>All Free plan benefits</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Pre-due return reminder alerts (3 days prior)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Daily overdue notification alerts</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Weekly digest summary option</span>
              </li>
            </ul>
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <Link href="/register" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Upgrade to Premium
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
