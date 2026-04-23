import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, currentMonthKey, monthLabel, generateMonthOptions, formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function StudentPortal() {
  const { studentSession } = useAuth();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [form, setForm] = useState({ month: currentMonthKey(), bkash_trx_id: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const adminPhone = localStorage.getItem('admin_phone') || '';
  const months = generateMonthOptions(6);

  useEffect(() => { if (studentSession?.id) load(); }, [studentSession]);

  async function load() {
    setLoading(true);
    const [{ data: stu }, { data: pmts }, { data: ntcs }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentSession.id).single(),
      supabase.from('payments').select('*').eq('student_id', studentSession.id).order('created_at', { ascending: false }),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
    ]);
    setStudent(stu);
    setPayments(pmts || []);
    setNotices(ntcs || []);
    if (stu) setForm(p => ({ ...p, amount: stu.monthly_rent }));
    setLoading(false);
  }

  async function submitPayment() {
    setSaving(true); setError(''); setSuccess('');

    // Check if already submitted for this month
    const existing = payments.find(p => p.month === form.month && ['pending', 'verified'].includes(p.status));
    if (existing) {
      setError(`You already submitted payment for ${monthLabel(form.month)} (${existing.status}).`);
      setSaving(false);
      return;
    }

    const { error: err } = await supabase.from('payments').insert([{
      student_id: studentSession.id,
      month: form.month,
      amount: Number(form.amount),
      bkash_trx_id: form.bkash_trx_id.trim(),
      payment_method: 'bkash',
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }]);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess('Payment submitted! Admin will verify your bKash transaction.');
    setShowPayModal(false);
    load();
  }

  const thisMonth = currentMonthKey();
  const thisMonthPayment = payments.find(p => p.month === thisMonth);

  if (loading) return <div className="page"><div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h2>My Portal</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{student?.name} · {student?.mess_id}</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* This month status */}
      <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${thisMonthPayment?.status === 'verified' ? 'var(--green)' : thisMonthPayment?.status === 'pending' ? 'var(--amber)' : 'var(--red)'}` }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>This Month — {monthLabel(thisMonth)}</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>
              {thisMonthPayment?.status === 'verified'
                ? <span style={{ color: 'var(--green)' }}>✓ Paid — {formatCurrency(thisMonthPayment.amount)}</span>
                : thisMonthPayment?.status === 'pending'
                ? <span style={{ color: 'var(--amber)' }}>⏳ Pending Verification</span>
                : <span style={{ color: 'var(--red)' }}>⚠️ Not Paid — {formatCurrency(student?.monthly_rent)}</span>
              }
            </div>
            {thisMonthPayment?.status === 'pending' && (
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                TrxID: {thisMonthPayment.bkash_trx_id} · Submitted {formatDate(thisMonthPayment.submitted_at)}
              </div>
            )}
          </div>
          {!thisMonthPayment && (
            <button className="btn btn-bkash" onClick={() => setShowPayModal(true)}>
              🔴 Pay via bKash
            </button>
          )}
        </div>
      </div>

      {/* How to pay instructions */}
      {!thisMonthPayment && adminPhone && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>How to Pay</h3></div>
          <div className="card-body">
            <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 2, color: 'var(--gray-700)' }}>
              <li>Open bKash app → <strong>Send Money</strong></li>
              <li>Send to: <strong style={{ fontFamily: 'DM Mono', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{adminPhone}</strong></li>
              <li>Amount: <strong>{formatCurrency(student?.monthly_rent)}</strong></li>
              <li>Reference: <strong style={{ fontFamily: 'DM Mono', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{student?.mess_id} {thisMonth}</strong></li>
              <li>Copy the Transaction ID (TrxID)</li>
              <li>Click "Pay via bKash" button above and submit the TrxID</li>
            </ol>
          </div>
        </div>
      )}

      {/* Student info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><h3>My Info</h3></div>
          <div className="card-body">
            <table style={{ fontSize: 13, width: '100%' }}>
              <tbody>
                {[['MESS ID', student?.mess_id], ['Room', student?.room_number || '—'], ['Seat', student?.seat_type], ['Monthly Rent', formatCurrency(student?.monthly_rent)], ['Joined', formatDate(student?.joining_date)]].map(([k, v]) => (
                  <tr key={k}><td style={{ color: 'var(--gray-500)', paddingBottom: 6, width: 110 }}>{k}</td><td style={{ fontWeight: 500 }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notices */}
        <div className="card">
          <div className="card-header"><h3>Notices</h3></div>
          <div className="card-body" style={{ padding: '10px 16px' }}>
            {notices.length === 0 ? <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No notices.</p>
              : notices.map(n => (
                <div key={n.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{n.body}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <div className="card-header"><h3>Payment History</h3></div>
        {payments.length === 0 ? (
          <div className="empty"><p>No payment records yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Amount</th><th>bKash TrxID</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{monthLabel(p.month)}</td>
                    <td style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                    <td><span className="td-id">{p.bkash_trx_id || '—'}</span></td>
                    <td>
                      <span className={`badge ${p.status === 'verified' ? 'badge-green' : p.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{formatDate(p.submitted_at || p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      <Modal
        open={showPayModal}
        onClose={() => { setShowPayModal(false); setError(''); }}
        title="Submit bKash Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
            <button className="btn btn-bkash" onClick={submitPayment} disabled={saving || !form.bkash_trx_id}>
              {saving ? <><span className="spinner" /> Submitting…</> : '🔴 Submit Payment'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <div className="alert alert-info" style={{ marginBottom: 14 }}>
          First send money via bKash, then enter the TrxID here. Admin will verify and confirm.
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Month</label>
            <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}>
              {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (৳)</label>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="form-group form-span-2">
            <label>bKash Transaction ID (TrxID) *</label>
            <input value={form.bkash_trx_id} onChange={e => setForm(p => ({ ...p, bkash_trx_id: e.target.value }))} placeholder="e.g. 8YJK5P3ABC" required />
          </div>
        </div>
      </Modal>
    </div>
  );
}
