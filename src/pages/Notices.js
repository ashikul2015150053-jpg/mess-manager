import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    setNotices(data || []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    await supabase.from('notices').insert([form]);
    setSaving(false);
    setShowModal(false);
    setForm({ title: '', body: '', priority: 'normal' });
    load();
  }

  async function deleteNotice(id) {
    if (!window.confirm('Delete this notice?')) return;
    await supabase.from('notices').delete().eq('id', id);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Notices</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post Notice
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : notices.length === 0 ? (
        <div className="empty card" style={{ padding: 48 }}><p>No notices yet.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notices.map(n => (
            <div key={n.id} className="card" style={{
              borderLeft: `4px solid ${n.priority === 'urgent' ? 'var(--red)' : 'var(--green)'}`,
            }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {n.priority === 'urgent' && <span className="badge badge-red">🔴 Urgent</span>}
                      <h3 style={{ fontSize: 15 }}>{n.title}</h3>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6 }}>{n.body}</p>
                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>Posted {formatDate(n.created_at)}</p>
                  </div>
                  {isAdmin && (
                    <button className="btn btn-icon btn-sm" onClick={() => deleteNotice(n.id)}>🗑</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Post Notice"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !form.title || !form.body}>
              {saving ? <><span className="spinner" /> Posting…</> : 'Post Notice'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group form-span-2">
            <label>Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="January Rent Due" />
          </div>
          <div className="form-group form-span-2">
            <label>Message *</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Write the notice here…" rows={4} />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent 🔴</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
