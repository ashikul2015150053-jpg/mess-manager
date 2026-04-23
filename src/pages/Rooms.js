import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ room_number: '', capacity: 1, floor: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from('rooms').select('*').order('floor').order('room_number'),
      supabase.from('students').select('room_number').eq('status', 'active'),
    ]);
    setRooms(r || []);
    setStudents(s || []);
    setLoading(false);
  }

  async function addRoom() {
    setSaving(true);
    await supabase.from('rooms').insert([{ ...form, capacity: Number(form.capacity), floor: Number(form.floor) }]);
    setSaving(false);
    setShowModal(false);
    setForm({ room_number: '', capacity: 1, floor: 1 });
    load();
  }

  async function deleteRoom(id) {
    if (!window.confirm('Delete this room?')) return;
    await supabase.from('rooms').delete().eq('id', id);
    load();
  }

  function occupancy(roomNum) {
    return students.filter(s => s.room_number === roomNum).length;
  }

  const grouped = rooms.reduce((acc, r) => {
    const f = `Floor ${r.floor}`;
    if (!acc[f]) acc[f] = [];
    acc[f].push(r);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <h2>Rooms</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Room
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : rooms.length === 0 ? (
        <div className="empty card" style={{ padding: 48 }}><p>No rooms added yet. Add rooms to track occupancy.</p></div>
      ) : (
        Object.entries(grouped).map(([floor, floorRooms]) => (
          <div key={floor} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12, fontWeight: 600 }}>{floor}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {floorRooms.map(room => {
                const occ = occupancy(room.room_number);
                const full = occ >= room.capacity;
                const empty = occ === 0;
                return (
                  <div key={room.id} className="card" style={{ border: `2px solid ${full ? 'var(--red)' : empty ? 'var(--gray-200)' : 'var(--green)'}` }}>
                    <div className="card-body" style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono', marginBottom: 4 }}>
                        {room.room_number}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
                        {occ}/{room.capacity} beds occupied
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`badge ${full ? 'badge-red' : empty ? 'badge-gray' : 'badge-green'}`}>
                          {full ? 'Full' : empty ? 'Empty' : 'Available'}
                        </span>
                        <button className="btn btn-icon btn-sm" onClick={() => deleteRoom(room.id)}>🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Room"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addRoom} disabled={saving || !form.room_number}>
              {saving ? <><span className="spinner" /> Saving…</> : 'Add Room'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Room Number *</label>
            <input value={form.room_number} onChange={e => setForm(p => ({ ...p, room_number: e.target.value }))} placeholder="101" />
          </div>
          <div className="form-group">
            <label>Floor</label>
            <input type="number" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} min={1} />
          </div>
          <div className="form-group">
            <label>Bed Capacity</label>
            <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} min={1} max={8} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
