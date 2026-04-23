import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, currentMonthKey, monthLabel, generateMonthOptions, whatsappLink } from '../lib/utils';

export default function Dues() {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthKey());
  const [adminPhone, setAdminPhone] = useState(localStorage.getItem('admin_phone') || '');
  const months = generateMonthOptions(12);

  useEffect(() => { load(); }, [month]);

  async function load() {
    setLoading(true);

    // Get active students
    const { data: students } = await supabase
      .from('students')
      .select('id, name, mess_id, phone, monthly_rent, room_number')
      .eq('status', 'active');

    // Get verified payments for this month
    const { data: payments } = await supabase
      .from('payments')
      .select('student_id, amount, status')
      .eq('month', month)
      .eq('status', 'verified');

    const paidMap = {};
    (payments || []).forEach(p => { paidMap[p.student_id] = p.amount; });

    const unpaid = (students || []).filter(s => !paidMap[s.id]);
    setDues(unpaid);
    setLoading(false);
  }

  function savePhone(p) {
    setAdminPhone(p);
    localStorage.setItem('admin_phone', p);
  }

  function buildMessage(student) {
    const ml = monthLabel(month);
    return `আস্সালামু আলাইকুম ${student.name} ভাই,\n\n${ml} মাসের মেস ভাড়া ৳${student.monthly_rent} এখনো পাওয়া যায়নি।\n\nবিকাশে পাঠান: ${adminPhone}\nReference: ${student.mess_id} ${month}\n\nধন্যবাদ।`;
  }

  const totalDue = dues.reduce((s, d) => s + Number(d.monthly_rent), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dues Tracker</h2>
        <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13 }}>
          {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      {/* Admin phone (for WhatsApp messages) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>Your bKash / WhatsApp Number:</label>
          <input
            value={adminPhone} onChange={e => savePhone(e.target.value)}
            placeholder="017XXXXXXXX" style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, width: 180 }}
          />
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Used in payment reminder messages</span>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card red">
            <div className="stat-label">Unpaid Students</div>
            <div className="stat-value">{dues.length}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Total Dues</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(totalDue)}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Unpaid — {monthLabel(month)}</h3>
          {dues.length > 0 && adminPhone && (
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Click WhatsApp button to send reminder</span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : dues.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <p style={{ fontWeight: 600, color: 'var(--green)' }}>All students paid for {monthLabel(month)}!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>MESS ID</th><th>Name</th><th>Phone</th>
                <th>Room</th><th>Due Amount</th><th>Remind</th>
              </tr></thead>
              <tbody>
                {dues.map(s => (
                  <tr key={s.id}>
                    <td><span className="td-id">{s.mess_id}</span></td>
                    <td><span className="td-name">{s.name}</span></td>
                    <td>{s.phone}</td>
                    <td>{s.room_number || '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(s.monthly_rent)}</td>
                    <td>
                      {adminPhone ? (
                        <a
                          href={whatsappLink(s.phone, buildMessage(s))}
                          target="_blank" rel="noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          📱 WhatsApp
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Add your number above</span>
                      )}
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
