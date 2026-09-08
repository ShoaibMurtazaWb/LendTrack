// =============================================================================
// LendTrack :: Contacts Management Address Book
// apps/web/app/contacts/page.tsx
// =============================================================================

'use client';

import React, { useState } from 'react';
import { useContacts } from '../../hooks/useContacts.js';
import { 
  Plus, 
  Mail, 
  Phone, 
  Trash2, 
  Edit3, 
  User, 
  FileText, 
  X,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function ContactsPage() {
  const { contacts, isLoadingContacts, createContact, updateContact, deleteContact } = useContacts();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingContact(null);
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: any) => {
    setEditingContact(contact);
    setName(contact.name);
    setEmail(contact.email || '');
    setPhone(contact.phone || '');
    setNotes(contact.notes || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      if (editingContact) {
        await updateContact({ id: editingContact.id, body: payload });
      } else {
        await createContact(payload);
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your contact book?`)) {
      return;
    }
    try {
      await deleteContact(id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete contact.');
    }
  };

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoadingContacts) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin text-gradient-primary" size={36} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading address book...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header block */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Address Book</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage profiles for friends, family, and neighbors.</p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-panel-static" style={{ display: 'flex', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '8px 16px', width: '100%', maxWidth: '400px' }}>
          <User size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search contacts by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Grid listing */}
      {filteredContacts.length === 0 ? (
        <div className="glass-panel-static" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          No contact cards found. Click "Add Contact" to start creating one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredContacts.map((contact: any) => (
            <div key={contact.id} className="glass-panel-static" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-glass)' }}>
              
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--primary-glow)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '16px' }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px' }}>{contact.name}</h3>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleOpenEdit(contact)} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px', borderRadius: '8px', border: 'none' }}
                    title="Edit Contact"
                  >
                    <Edit3 size={14} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button 
                    onClick={() => handleDelete(contact.id, contact.name)} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px', borderRadius: '8px', border: 'none' }}
                    title="Delete Contact"
                  >
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              </div>

              {/* Details card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={12} />
                  <span>{contact.email || 'No email saved'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={12} />
                  <span>{contact.phone || 'No phone number'}</span>
                </div>
                {contact.notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                    <FileText size={12} style={{ marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.3 }}>{contact.notes}</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Editor Modal Popup */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="glass-panel-static" style={{ maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-glass-glow)' }}>
            
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '20px' }}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Johnathan Doe"
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
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="notes">Notes / Details</label>
                <textarea
                  id="notes"
                  className="form-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., neighbor at building B, borrows garden tools"
                />
              </div>

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
                    'Save Contact'
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
