// =============================================================================
// LendTrack :: Private User Dashboard
// apps/web/app/dashboard/page.tsx
// =============================================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth.js';
import { useLoans } from '../../hooks/useLoans.js';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Plus, 
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { loans, summary, isLoadingSummary, isLoadingLoans, refetchSummary, refetchLoans } = useLoans();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoadingSummary || isLoadingLoans) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin text-gradient-primary" size={36} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (!user) return null;

  const activeLoansList = loans.filter((l: any) => l.status === 'active' || l.status === 'overdue');
  const overdueLoansList = loans.filter((l: any) => l.status === 'overdue');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>
            Hello, <span className="text-gradient">{profile?.full_name || user.email}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Here is a summary of the items you are tracking today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/loans?create=true" className="btn btn-primary">
            <Plus size={16} /> Log New Loan
          </Link>
          {profile?.plan === 'free' && (
            <Link href="/settings" className="btn btn-secondary" style={{ borderColor: 'var(--primary)', color: '#a5b4fc' }}>
              <Sparkles size={16} style={{ color: '#c084fc' }} /> Upgrade to Premium
            </Link>
          )}
        </div>
      </div>

      {/* Overdue Alerts banner */}
      {summary?.overdueLoansCount > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={20} />
          <div>
            <span style={{ fontWeight: 700 }}>Attention needed:</span> You have{' '}
            <span style={{ fontWeight: 700 }}>{summary.overdueLoansCount} overdue loan(s)</span>. 
            We have dispatched reminders for outstanding items. 
            <Link href="/loans?filter=overdue" style={{ textDecoration: 'underline', marginLeft: '8px', color: '#fff' }}>
              Resolve now
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        
        {/* Active Loans */}
        <div className="glass-panel-static" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px', color: 'var(--info)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Loans</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{summary?.activeLoansCount || 0}</div>
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="glass-panel-static" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Overdue</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{summary?.overdueLoansCount || 0}</div>
          </div>
        </div>

        {/* Due in 7 Days */}
        <div className="glass-panel-static" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '12px', color: 'var(--warning)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Due Next 7 Days</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{summary?.upcomingDueCount || 0}</div>
          </div>
        </div>

        {/* Free Plan Limit Counter */}
        {profile?.plan === 'free' && (
          <div className="glass-panel-static" style={{ display: 'flex', gap: '16px', alignItems: 'center', border: '1px dashed var(--border-glass-glow)' }}>
            <div style={{ background: 'rgba(165, 180, 252, 0.1)', padding: '12px', borderRadius: '12px', color: '#c084fc' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Free Capacity</div>
              <div style={{ fontSize: '28px', fontWeight: 800 }}>{summary?.freeTrialLoansRemaining ?? 0} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 5 left</span></div>
            </div>
          </div>
        )}
      </section>

      {/* Main Dashboard Panel: Active Loans and Quick Details */}
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Active List */}
        <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="flex-between">
            <h2 style={{ fontSize: '20px' }}>Current Outstanding Loans</h2>
            <Link href="/loans" style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {activeLoansList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={32} style={{ color: 'var(--success)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Awesome! All items have been returned.</p>
              <Link href="/loans?create=true" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Create your first loan
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Friend</th>
                    <th>Direction</th>
                    <th>Loaned Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoansList.slice(0, 5).map((loan: any) => {
                    const isLent = loan.direction === 'lent_out';
                    return (
                      <tr key={loan.id} onClick={() => router.push(`/loans/${loan.id}`)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600 }}>{loan.item?.name || 'Unknown Item'}</td>
                        <td>{loan.contact?.name || 'Unknown Contact'}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: isLent ? '#818cf8' : '#c084fc' }}>
                            {isLent ? (
                              <>
                                <ArrowUpRight size={14} /> Lent Out
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft size={14} /> Borrowed
                              </>
                            )}
                          </span>
                        </td>
                        <td>{loan.loaned_at}</td>
                        <td style={{ color: loan.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>
                          {loan.expected_return_at || 'No due date'}
                        </td>
                        <td>
                          <span className={`badge badge-${loan.status}`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Stats Summary */}
          <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Lending Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lent Out items:</span>
                <span style={{ fontWeight: 600 }}>{loans.filter((l: any) => l.direction === 'lent_out' && l.status !== 'returned').length}</span>
              </div>

              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Borrowed items:</span>
                <span style={{ fontWeight: 600 }}>{loans.filter((l: any) => l.direction === 'borrowed' && l.status !== 'returned').length}</span>
              </div>

              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Returned overall:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{loans.filter((l: any) => l.status === 'returned').length}</span>
              </div>

            </div>
          </div>

          {/* Premium Advert card */}
          {profile?.plan === 'free' && (
            <div className="glass-panel-static" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)', border: '1px solid var(--border-glass-glow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles style={{ color: '#c084fc' }} size={20} />
                <h4 style={{ fontSize: '15px' }}>Go Premium</h4>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Free plan users are capped at 5 active loans. Upgrade to unlock unlimited logging, pre-due alerts, and daily reminders!
              </p>
              <Link href="/settings" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', width: 'fit-content' }}>
                Upgrade ($5/mo)
              </Link>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
