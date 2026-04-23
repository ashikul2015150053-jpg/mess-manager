import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { formatDate, formatCurrency } from '../lib/utils';

const EMPTY_FORM = {
  name: '', phone: '', guardian_phone: '', university: '',
  room_number: '', seat_type: 'single', monthly_rent: 3000,
  joining_date: new Date().toISOString().split('T')[0],
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    let q = supabase.from('students').select('*').order('mess_id');
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setStudents(data || []);
    setLoading(false);
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.mess_id.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  function openAdd() {
    setEditStudent(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(s) {
    setEditStudent(s);
    setForm({
      name: s.name, phone: s.phone, guardian_phone: s.guardian_phone || '',
      university: s.university || '', room_number: s.room_number || '',
      seat_type: s.seat_type, monthly_rent: s.monthly_rent,
      joining_date: s.joining_date,
    });
    setError('');
    setShowModal(true);
  }

  async function save() {
    setSaving(true);
    setError('');
    const payload = { ...form, monthly_rent: Number(form.monthly_rent) };

    let err;
    if (editStudent) {
      ({ error: err } = await supabase.from('students').update(payload).eq('id', editStudent.id));
    } else {
      ({ error: err } = await supabase.from('students').insert([payload]));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowModal(false);
    load();
  }

  async function markLeft(id) {
    if (!window.confirm('Mark this student as left?')) return;
    await supabase.from('students').update({ status: 'left', left_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    load();
  }

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Students</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search name, ID, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13 }}>
          <option value="active">Active</option>
          <option value="left">Left</option>
          <option value="all">All</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--gray-500)', alignSelf: 'center' }}>{filtered.length} students</span>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><p>No students found.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>MESS ID</th><th>Name</th><th>Phone</th>
                <th>Room</th><th>Rent</th><th>Joined</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><span className="td-id">{s.mess_id}</span></td>
                    <td>
                      <div className="td-name">{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.university}</div>
                    </td>
                    <td>{s.phone}</td>
                    <td>{s.room_number || '—'} <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>({s.seat_type})</span></td>
                    <td style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{formatCurrency(s.monthly_rent)}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{formatDate(s.joining_date)}</td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-icon btn-sm" title="Edit" onClick={() => openEdit(s)}>✏️</button>
                        {s.status === 'active' && (
                          <button className="btn btn-icon btn-sm" title="Mark as left" onClick={() => markLeft(s.id)}>🚪</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editStudent ? `Edit — ${editStudent.mess_id}` : 'Add New Student'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : 'Save Student'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.name} onChange={f('name')} placeholder="Rakibul Hasan" required />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input value={form.phone} onChange={f('phone')} placeholder="01XXXXXXXXX" />
          </div>
          <div className="form-group">
            <label>Guardian Phone</label>
            <input value={form.guardian_phone} onChange={f('guardian_phone')} placeholder="01XXXXXXXXX" />
          </div>
          <div className="form-group">
            <label>University / College</label>
            <input value={form.university} onChange={f('university')} placeholder="RUET" />
          </div>
          <div className="form-group">
            <label>Room Number</label>
            <input value={form.room_number} onChange={f('room_number')} placeholder="101" />
          </div>
          <div className="form-group">
            <label>Seat Type</label>
            <select value={form.seat_type} onChange={f('seat_type')}>
              <option value="single">Single</option>
              <option value="shared">Shared</option>
            </select>
          </div>
          <div className="form-group">
            <label>Monthly Rent (৳) *</label>
            <input type="number" value={form.monthly_rent} onChange={f('monthly_rent')} min={500} />
          </div>
          <div className="form-group">
            <label>Joining Date</label>
            <input type="date" value={form.joining_date} onChange={f('joining_date')} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
