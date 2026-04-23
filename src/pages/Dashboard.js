import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, currentMonthKey, monthLabel, formatDate } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, paidThisMonth: 0, unpaid: 0, pendingVerify: 0, totalExpected: 0, totalCollected: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const month = currentMonthKey();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const [{ data: students }, { data: payments }, { data: noticesData }] = await Promise.all([
      supabase.from('students').select('id, monthly_rent, name, mess_id').eq('status', 'active'),
      supabase.from('payments').select('*, students(name, mess_id)').eq('month', month).order('created_at', { ascending: false }),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
    ]);

    const totalStudents = students?.length || 0;
    const totalExpected = students?.reduce((s, r) => s + Number(r.monthly_rent), 0) || 0;
    const verified = payments?.filter(p => p.status === 'verified') || [];
    const paidIds = new Set(verified.map(p => p.student_id));
    const paidThisMonth = paidIds.size;
    const unpaid = totalStudents - paidThisMonth;
    const pendingVerify = payments?.filter(p => p.status === 'pending').length || 0;
    const totalCollected = verified.reduce((s, p) => s + Number(p.amount), 0);

    setStats({ totalStudents, paidThisMonth, unpaid, pendingVerify, totalExpected, totalCollected });
    setRecentPayments((payments || []).slice(0, 6));
    setNotices(noticesData || []);
    setLoading(false);
  }

  const statusBadge = (s) => {
    const map = { verified: 'badge-green', pending: 'badge-amber', rejected: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  if (loading) return <div className="page"><div style={{textAlign:'center',padding:60}}><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{color:'var(--gray-500)',fontSize:13,marginTop:2}}>{monthLabel(month)}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadDashboard}>↻ Refresh</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-sub">Active this month</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Paid</div>
          <div className="stat-value">{stats.paidThisMonth}</div>
          <div className="stat-sub">of {stats.totalStudents} students</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Unpaid</div>
          <div className="stat-value">{stats.unpaid}</div>
          <div className="stat-sub">Not yet paid</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending Verify</div>
          <div className="stat-value">{stats.pendingVerify}</div>
          <div className="stat-sub">bKash to confirm</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Collected</div>
          <div className="stat-value" style={{fontSize:20}}>{formatCurrency(stats.totalCollected)}</div>
          <div className="stat-sub">of {formatCurrency(stats.totalExpected)} expected</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,alignItems:'start'}}>
        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Payments — {monthLabel(month)}</h3>
          </div>
          {recentPayments.length === 0 ? (
            <div className="empty"><p>No payments this month yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>bKash TrxID</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr></thead>
                <tbody>
                  {recentPayments.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="td-name">{p.students?.name}</div>
                        <div className="td-id">{p.students?.mess_id}</div>
                      </td>
                      <td style={{fontFamily:'DM Mono',fontWeight:600}}>{formatCurrency(p.amount)}</td>
                      <td><span className="td-id">{p.bkash_trx_id || '—'}</span></td>
                      <td>{statusBadge(p.status)}</td>
                      <td style={{fontSize:12,color:'var(--gray-500)'}}>{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card">
          <div className="card-header"><h3>Notices</h3></div>
          <div className="card-body" style={{padding:'12px 16px'}}>
            {notices.length === 0 ? (
              <div className="empty" style={{padding:'24px 0'}}><p>No notices posted.</p></div>
            ) : notices.map(n => (
              <div key={n.id} style={{
                padding:'10px 12px', borderRadius:8, marginBottom:8,
                background: n.priority === 'urgent' ? 'var(--red-light)' : 'var(--gray-50)',
                border: `1px solid ${n.priority === 'urgent' ? '#f5c6c2' : 'var(--gray-200)'}`
              }}>
                {n.priority === 'urgent' && <span className="badge badge-red" style={{marginBottom:4}}>Urgent</span>}
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{n.title}</div>
                <div style={{fontSize:12,color:'var(--gray-500)'}}>{n.body}</div>
                <div style={{fontSize:11,color:'var(--gray-400)',marginTop:4}}>{formatDate(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
