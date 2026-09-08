// =============================================================================
// LendTrack :: Loan Detailed Audit Page
// apps/web/app/loans/[id]/page.tsx
// =============================================================================

'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLoan, useLoans } from '../../../hooks/useLoans.js';
import { 
  ArrowLeft, 
  User, 
  Layers, 
  Calendar, 
  Trash2, 
  Check, 
  AlertTriangle,
  History,
  Mail,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function LoanDetailsPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const { loan, isLoadingLoan, loanError, refetchLoan } = useLoan(id);
  const { logReturn, isLoggingReturn, deleteLoan, isDeletingLoan } = useLoans();

  const handleReturn = async () => {
    if (!id) return;
    try {
      await logReturn(id);
      refetchLoan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this loan record? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteLoan(id);
      router.push('/loans');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoadingLoan) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin text-gradient-primary" size={36} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading loan audit file...</p>
      </div>
    );
  }

  if (loanError || !loan) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '24px' }}>Loan record not found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The details could not be retrieved. It may have been deleted or access was denied.</p>
        <button onClick={() => router.push('/loans')} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Loans
        </button>
      </div>
    );
  }

  const isLent = loan.direction === 'lent_out';
  const isActive = loan.status === 'active' || loan.status === 'overdue';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header Back navigation */}
      <div className="flex-between">
        <button onClick={() => router.push('/loans')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to ledger
        </button>

        <button 
          onClick={handleDelete} 
          className="btn btn-secondary" 
          style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
          disabled={isDeletingLoan}
        >
          <Trash2 size={16} /> Delete Record
        </button>
      </div>

      {/* Main Details Panel */}
      <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Title and Badge */}
        <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: isLent ? '#818cf8' : '#c084fc', fontWeight: 700 }}>
              {isLent ? 'Lent Out Item' : 'Borrowed Item'}
            </span>
            <h1 style={{ fontSize: '28px', marginTop: '4px' }}>{loan.item?.name}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`badge badge-${loan.status}`} style={{ padding: '8px 16px', fontSize: '14px' }}>
              {loan.status}
            </span>
            
            {isActive && (
              <button 
                onClick={handleReturn} 
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
                disabled={isLoggingReturn}
              >
                <Check size={16} /> Mark Returned
              </button>
            )}
          </div>
        </div>

        {/* Content sections grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Item details */}
          <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Layers size={18} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Item Specs</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Category: </span><span style={{ fontWeight: 600 }}>{loan.item?.category || 'General'}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Description: </span><p style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{loan.item?.description || 'No description provided.'}</p></div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <User size={18} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{isLent ? 'Lent To' : 'Borrowed From'}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Name: </span><span style={{ fontWeight: 600 }}>{loan.contact?.name}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Email: </span><span style={{ fontWeight: 600 }}>{loan.contact?.email || 'No email registered'}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Phone: </span><span style={{ fontWeight: 600 }}>{loan.contact?.phone || 'No phone number'}</span></div>
            </div>
          </div>

        </div>

        {/* Dates Block */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date Loaned</span>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '15px' }}><Calendar size={14} /> {loan.loaned_at}</span>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Expected Return</span>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '15px', color: loan.status === 'overdue' ? 'var(--danger)' : 'inherit' }}><Clock size={14} /> {loan.expected_return_at || 'No Date'}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Actual Return Date</span>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '15px', color: 'var(--success)' }}><Check size={14} /> {loan.returned_at || 'Not returned'}</span>
          </div>
        </div>

        {/* Notes */}
        {loan.notes && (
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Loan Audit Notes</h3>
            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{loan.notes}</p>
          </div>
        )}

      </div>

      {/* Reminder logs audit trail */}
      <div className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} />
          <h2 style={{ fontSize: '18px' }}>Reminder Dispatch Logs</h2>
        </div>

        {loan.reminderLogs?.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No email reminder triggers have been logged for this file yet.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '14px' }}>
              <thead>
                <tr>
                  <th>Dispatch Time</th>
                  <th>Reminder Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.reminderLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td>{new Date(log.sent_at).toLocaleString()}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {log.type === 'pre_due' ? 'Pre-Due Alert' : log.type === 'overdue' ? 'Overdue Notice' : log.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'sent' ? 'badge-returned' : 'badge-overdue'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
