// =============================================================================
// LendTrack :: Loans Management & Creation List
// apps/web/app/loans/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoans } from '../../hooks/useLoans.js';
import { useContacts } from '../../hooks/useContacts.js';
import { useItems } from '../../hooks/useItems.js';
import { useAuth } from '../../hooks/useAuth.js';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  AlertCircle, 
  Calendar,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function LoansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  
  const { loans, summary, createLoan, logReturn, isLoggingReturn, refetchSummary } = useLoans();
  const { contacts, createContact } = useContacts();
  const { items, createItem } = useItems();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, overdue, returned
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [direction, setDirection] = useState<'lent_out' | 'borrowed'>('lent_out');
  const [useExistingItem, setUseExistingItem] = useState(true);
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  
  const [useExistingContact, setUseExistingContact] = useState(true);
  const [contactId, setContactId] = useState('');
  const [contactName, setContactName] = useState('');
  
  const [loanedAt, setLoanedAt] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to search param ?create=true or ?filter=overdue
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowModal(true);
    }
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setShowModal(false);
    // Clear URL query
    router.replace('/loans');
    setFormError(null);
  };

  const handleCreateLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload: any = {
      direction,
      loaned_at: loanedAt,
      expected_return_at: expectedReturnAt || null,
      notes: notes || null,
    };

    // Item setup
    if (useExistingItem) {
      if (!itemId) {
        setFormError('Please select an item.');
        setIsSubmitting(false);
        return;
      }
      payload.item_id = itemId;
    } else {
      if (!itemName) {
        setFormError('Please input an item name.');
        setIsSubmitting(false);
        return;
      }
      payload.item_name = itemName;
      payload.item_category = itemCategory || 'General';
    }

    // Contact setup
    if (useExistingContact) {
      if (!contactId) {
        setFormError('Please select a contact.');
        setIsSubmitting(false);
        return;
      }
      payload.contact_id = contactId;
    } else {
      if (!contactName) {
        setFormError('Please input a contact name.');
        setIsSubmitting(false);
        return;
      }
      payload.contact_name = contactName;
    }

    try {
      await createLoan(payload);
      handleCloseModal();
      // Reset form fields
      setItemId('');
      setItemName('');
      setItemCategory('');
      setContactId('');
      setContactName('');
      setExpectedReturnAt('');
      setNotes('');
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to create loan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReturn = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating to loan details page
    try {
      await logReturn(id);
    } catch (err) {
      console.error('Failed to log return:', err);
    }
  };

  // Filter and search
  const filteredLoans = loans.filter((loan: any) => {
    const matchesSearch = 
      (loan.item?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (loan.contact?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (loan.notes || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    return loan.status === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title block */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Loans Ledger</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log and audit items you have lent out or borrowed.</p>
        </div>
        
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Log a Loan
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel-static" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '16px 24px' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {['all', 'active', 'overdue', 'returned'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '14px', textTransform: 'capitalize' }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '6px 16px', minWidth: '280px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search items, friends, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

      </div>

      {/* Main Table List */}
      <div className="glass-panel-static" style={{ padding: 0 }}>
        {filteredLoans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            No loans match the current query or filter criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Friend</th>
                  <th>Direction</th>
                  <th>Loaned At</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan: any) => {
                  const isLent = loan.direction === 'lent_out';
                  return (
                    <tr 
                      key={loan.id} 
                      onClick={() => router.push(`/loans/${loan.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{loan.item?.name}</td>
                      <td>{loan.contact?.name}</td>
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
                        {loan.expected_return_at || 'No expected date'}
                      </td>
                      <td>
                        <span className={`badge badge-${loan.status}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {(loan.status === 'active' || loan.status === 'overdue') && (
                          <button
                            onClick={(e) => handleQuickReturn(loan.id, e)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}
                            disabled={isLoggingReturn}
                          >
                            <Check size={14} /> Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal Overlay */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="glass-panel-static" style={{ maxWidth: '560px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-glass-glow)' }}>
            
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '22px' }}>Log a new item loan</h2>
              <button onClick={handleCloseModal} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert-banner" style={{ margin: 0, padding: '12px 16px' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '14px' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Direction */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Loan Direction</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDirection('lent_out')}
                    className={`btn ${direction === 'lent_out' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    I Lent It Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('borrowed')}
                    className={`btn ${direction === 'borrowed' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    I Borrowed It
                  </button>
                </div>
              </div>

              {/* Item selection */}
              <div className="form-group" style={{ margin: 0, border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Physical Item Details</label>
                  <button
                    type="button"
                    onClick={() => setUseExistingItem(!useExistingItem)}
                    style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    {useExistingItem ? '+ Create New Item' : 'Select Existing'}
                  </button>
                </div>

                {useExistingItem ? (
                  <select
                    className="form-input"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-space)' }}
                  >
                    <option value="">-- Choose Item --</option>
                    {items.map((i: any) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Item Name (e.g. Cordless Drill)"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required={!useExistingItem}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Category (e.g. Tools)"
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Contact selection */}
              <div className="form-group" style={{ margin: 0, border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Borrower / Lender Friend</label>
                  <button
                    type="button"
                    onClick={() => setUseExistingContact(!useExistingContact)}
                    style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    {useExistingContact ? '+ Create New Contact' : 'Select Existing'}
                  </button>
                </div>

                {useExistingContact ? (
                  <select
                    className="form-input"
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-space)' }}
                  >
                    <option value="">-- Choose Friend --</option>
                    {contacts.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Friend's Full Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required={!useExistingContact}
                  />
                )}
              </div>

              {/* Dates grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Loaned Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={loanedAt}
                    onChange={(e) => setLoanedAt(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Expected Return Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expectedReturnAt}
                    onChange={(e) => setExpectedReturnAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Additional Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Notes about item condition, coordinates..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '8px' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Log Loan'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
