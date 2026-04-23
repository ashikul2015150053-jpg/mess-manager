import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { formatDate, formatCurrency, generateMonthOptions, currentMonthKey, monthLabel } from '../lib/utils';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthKey());
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_id: '', amount: '', bkash_trx_id: '', notes: '', payment_method: 'bkash' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const months = generateMonthOptions(12);

  useEffect(() => { load(); }, [month, filter]);
  useEffect(() => { loadStudents(); }, []);

  async function load() {
    setLoading(true);
    let q = supabase.from('payments').select('*, students(name, mess_id, monthly_rent)').eq('month', month).order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setPayments(data || []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('id, name, mess_id, monthly_rent').eq('status', 'active').order('mess_id');
    setStudents(data || []);
  }

  async function updateStatus(id, status) {
    await supabase.from('payments').update({ status, verified_at: new Date().toISOString(), verified_by: 'admin' }).eq('id', id);
    load();
  }

  async function addPayment() {
    setSaving(true); setError('');
    const stu = students.find(s => s.id === form.student_id);
    const payload = {
      student_id: form.student_id,
      month,
      amount: Number(form.amount) || Number(stu?.monthly_rent) || 0,
      bkash_trx_id: form.bkash_trx_id,
      notes: form.notes,
      payment_method: form.payment_method,
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: 'admin',
    };
    const { error: err } = await supabase.from('payments').insert([payload]);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowAddModal(false);
    setForm({ student_id: '', amount: '', bkash_trx_id: '', notes: '', payment_method: 'bkash' });
    load();
  }

  const statusBadge = (s) => {
    const map = { verified: ['badge-green', '✓ Verified'], pending: ['badge-amber', '⏳ Pending'], rejected: ['badge-red', '✗ Rejected'] };
    const [cls, label] = map[s] || ['badge-gray', s];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const totalVerified = payments.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Payments</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Payment
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13 }}>
          {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{payments.length} records</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, fontFamily: 'DM Mono' }}>Collected: {formatCurrency(totalVerified)}</span>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty"><p>No payments for {monthLabel(month)}.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Student</th><th>Amount</th><th>Method</th>
                <th>bKash TrxID</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="td-name">{p.students?.name}</div>
                      <div className="td-id">{p.students?.mess_id}</div>
                    </td>
                    <td style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                    <td>
                      <span className={`badge ${p.payment_method === 'bkash' ? 'badge-bkash' : 'badge-gray'}`}>
                        {p.payment_method === 'bkash' ? '🔴 bKash' : p.payment_method}
                      </span>
                    </td>
                    <td><span className="td-id">{p.bkash_trx_id || '—'}</span></td>
                    <td>{statusBadge(p.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{formatDate(p.submitted_at || p.created_at)}</td>
                    <td>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => updateStatus(p.id, 'verified')}>✓ Verify</button>
                          <button className="btn btn-sm btn-danger" onClick={() => updateStatus(p.id, 'rejected')}>✗ Reject</button>
                        </div>
                      )}
                      {p.status === 'verified' && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Done</span>}
                      {p.status === 'rejected' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(p.id, 'pending')}>↩ Reset</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Payment (Admin)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addPayment} disabled={saving || !form.student_id}>
              {saving ? <><span className="spinner" /> Saving…</> : 'Save Payment'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <div className="alert alert-info" style={{ marginBottom: 14 }}>
          This records a payment as already verified (admin entry). Use this for cash payments or manually confirmed bKash.
        </div>
        <div className="form-grid">
          <div className="form-group form-span-2">
            <label>Student *</label>
            <select value={form.student_id} onChange={e => {
              const stu = students.find(s => s.id === e.target.value);
              setForm(p => ({ ...p, student_id: e.target.value, amount: stu?.monthly_rent || '' }));
            }}>
              <option value="">Select student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.mess_id} — {s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (৳) *</label>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
              <option value="bkash">bKash</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group form-span-2">
            <label>bKash TrxID (if applicable)</label>
            <input value={form.bkash_trx_id} onChange={e => setForm(p => ({ ...p, bkash_trx_id: e.target.value }))} placeholder="8YJK5P3ABC" />
          </div>
          <div className="form-group form-span-2">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional…" rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
