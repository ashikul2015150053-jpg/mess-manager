import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null); // for detail modal
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(3000);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  async function fetchRegistrations() {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_registrations')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false });
    if (!error) setRegistrations(data || []);
    setLoading(false);
  }

  function openModal(reg) {
    setSelected(reg);
    setAdminNotes(reg.admin_notes || '');
    setMonthlyRent(3000);
  }

  function closeModal() {
    setSelected(null);
    setAdminNotes('');
  }

  async function handleApprove() {
    if (!selected) return;
    setActionLoading(true);
    try {
      // Create student
      const { error: studentError } = await supabase
        .from('students')
        .insert([{
          name: selected.name,
          phone: selected.phone,
          guardian_phone: selected.guardian_phone || '',
          university: selected.university || '',
          room_number: selected.room_preference || '',
          seat_type: selected.seat_type || 'shared',
          monthly_rent: monthlyRent,
          joining_date: selected.move_in_date || new Date().toISOString().split('T')[0],
          status: 'active',
        }]);
      if (studentError) throw studentError;

      // Mark registration as approved
      const { error: regError } = await supabase
        .from('student_registrations')
        .update({ status: 'approved', admin_notes: adminNotes })
        .eq('id', selected.id);
      if (regError) throw regError;

      closeModal();
      fetchRegistrations();
      alert(`✅ ${selected.name} has been approved and added as a student!`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    if (!window.confirm(`Reject registration from ${selected.name}?`)) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({ status: 'rejected', admin_notes: adminNotes })
        .eq('id', selected.id);
      if (error) throw error;
      closeModal();
      fetchRegistrations();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  const counts = { pending: 0, approved: 0, rejected: 0 };
  // We only show current filter count — fetch all counts separately if needed

  return (
    <div className="page">
      <div className="page-header">
        <h1>Registrations</h1>
        <p className="page-subtitle">Review student applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="reg-tabs">
        {['pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            className={`reg-tab ${filter === tab ? 'active' : ''} ${tab}`}
            onClick={() => setFilter(tab)}
          >
            {tab === 'pending' && '⏳'}
            {tab === 'approved' && '✅'}
            {tab === 'rejected' && '❌'}
            {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Registration List */}
      {loading ? (
        <div className="loading-center"><span className="spinner" /></div>
      ) : registrations.length === 0 ? (
        <div className="empty-state card">
          <p>No {filter} registrations.</p>
        </div>
      ) : (
        <div className="reg-list">
          {registrations.map(reg => (
            <div key={reg.id} className="reg-item card" onClick={() => openModal(reg)}>
              <div className="reg-item-left">
                {reg.photo_url ? (
                  <img src={reg.photo_url} alt={reg.name} className="reg-avatar" />
                ) : (
                  <div className="reg-avatar-placeholder">👤</div>
                )}
              </div>
              <div className="reg-item-info">
                <div className="reg-item-name">{reg.name}</div>
                <div className="reg-item-meta">📞 {reg.phone}</div>
                {reg.university && <div className="reg-item-meta">🎓 {reg.university}</div>}
                <div className="reg-item-meta">
                  🪑 {reg.seat_type === 'single' ? 'Single' : 'Shared'} seat
                  {reg.room_preference && ` · Room ${reg.room_preference}`}
                </div>
              </div>
              <div className="reg-item-right">
                <span className={`badge ${reg.status === 'pending' ? 'badge-amber' : reg.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                  {reg.status}
                </span>
                <div className="reg-item-date">
                  {new Date(reg.created_at).toLocaleDateString('en-BD')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registration — {selected.name}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">

              {/* Photos row */}
              <div className="doc-photos">
                <div className="doc-photo-box">
                  <p className="doc-label">Profile Photo</p>
                  {selected.photo_url
                    ? <img src={selected.photo_url} alt="Profile" className="doc-photo" />
                    : <div className="doc-photo-empty">No photo</div>}
                </div>
                <div className="doc-photo-box">
                  <p className="doc-label">NID — Front</p>
                  {selected.nid_front_url
                    ? <img src={selected.nid_front_url} alt="NID Front" className="doc-photo" />
                    : <div className="doc-photo-empty">Not uploaded</div>}
                </div>
                <div className="doc-photo-box">
                  <p className="doc-label">NID — Back</p>
                  {selected.nid_back_url
                    ? <img src={selected.nid_back_url} alt="NID Back" className="doc-photo" />
                    : <div className="doc-photo-empty">Not uploaded</div>}
                </div>
              </div>

              {/* Info grid */}
              <div className="detail-grid">
                <div className="detail-item"><span>Phone</span><strong>{selected.phone}</strong></div>
                <div className="detail-item"><span>Guardian Phone</span><strong>{selected.guardian_phone || '—'}</strong></div>
                <div className="detail-item"><span>University</span><strong>{selected.university || '—'}</strong></div>
                <div className="detail-item"><span>Seat Type</span><strong>{selected.seat_type}</strong></div>
                <div className="detail-item"><span>Room Preference</span><strong>{selected.room_preference || '—'}</strong></div>
                <div className="detail-item"><span>Move-in Date</span><strong>{selected.move_in_date || '—'}</strong></div>
                <div className="detail-item"><span>Applied</span><strong>{new Date(selected.created_at).toLocaleString('en-BD')}</strong></div>
                <div className="detail-item"><span>Status</span>
                  <span className={`badge ${selected.status === 'pending' ? 'badge-amber' : selected.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                    {selected.status}
                  </span>
                </div>
              </div>

              {/* Only show actions for pending */}
              {selected.status === 'pending' && (
                <>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label>Monthly Rent (৳)</label>
                    <input
                      type="number"
                      value={monthlyRent}
                      onChange={e => setMonthlyRent(Number(e.target.value))}
                      style={{ maxWidth: 160 }}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Admin Notes (optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      rows={2}
                      placeholder="Any notes for this applicant..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
                      ❌ Reject
                    </button>
                    <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading ? <span className="spinner" /> : '✅ Approve & Add Student'}
                    </button>
                  </div>
                </>
              )}

              {selected.status !== 'pending' && selected.admin_notes && (
                <div className="alert-note">
                  <strong>Admin Notes:</strong> {selected.admin_notes}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <style>{`
        .reg-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .reg-tab {
          padding: 8px 20px;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          background: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: capitalize;
        }
        .reg-tab:hover { border-color: #9ca3af; }
        .reg-tab.active.pending { background: #fef3c7; border-color: #d97706; color: #92400e; }
        .reg-tab.active.approved { background: #d1fae5; border-color: #1a7a4a; color: #1a7a4a; }
        .reg-tab.active.rejected { background: #fee2e2; border-color: #c0392b; color: #c0392b; }
        .reg-list { display: flex; flex-direction: column; gap: 10px; }
        .reg-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: box-shadow 0.15s;
        }
        .reg-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .reg-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e5e7eb;
          flex-shrink: 0;
        }
        .reg-avatar-placeholder {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .reg-item-info { flex: 1; }
        .reg-item-name { font-weight: 700; font-size: 15px; color: #111827; }
        .reg-item-meta { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .reg-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .reg-item-date { font-size: 12px; color: #9ca3af; }
        .loading-center { display: flex; justify-content: center; padding: 48px; }
        .empty-state { text-align: center; padding: 48px; color: #9ca3af; }
        .modal-lg { max-width: 620px; }
        .doc-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .doc-photo-box { display: flex; flex-direction: column; gap: 6px; }
        .doc-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .doc-photo { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; border: 1.5px solid #e5e7eb; }
        .doc-photo-empty { width: 100%; aspect-ratio: 1; background: #f3f4f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .detail-item { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; background: #f9fafb; border-radius: 8px; }
        .detail-item span { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .detail-item strong { font-size: 14px; color: #111827; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
        .alert-note { margin-top: 16px; padding: 12px 16px; background: #f0faf4; border-radius: 8px; font-size: 14px; color: #374151; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea {
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--green, #1a7a4a); }
      `}</style>
    </div>
  );
}
