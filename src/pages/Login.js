import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { loginAdmin, loginStudent } = useAuth();
  const [tab, setTab] = useState('admin');
  const [adminPass, setAdminPass] = useState('');
  const [messId, setMessId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdminLogin(e) {
    e.preventDefault();
    setError('');
    const ok = loginAdmin(adminPass);
    if (!ok) setError('Wrong password. Try again.');
  }

  async function handleStudentLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: err } = await supabase
      .from('students')
      .select('*')
      .eq('mess_id', messId.trim().toUpperCase())
      .eq('phone', phone.trim())
      .eq('status', 'active')
      .single();

    setLoading(false);
    if (err || !data) {
      setError('MESS ID or phone number not found. Check and try again.');
      return;
    }
    loginStudent(data);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--gray-100)', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Mess Manager</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>Rangpur Student Mess</p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--gray-200)', borderRadius: 10,
          padding: 4, marginBottom: 20
        }}>
          {['admin', 'student'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                background: tab === t ? '#fff' : 'transparent',
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--gray-900)' : 'var(--gray-500)',
                fontSize: 13, cursor: 'pointer',
                boxShadow: tab === t ? 'var(--shadow)' : 'none',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {t === 'admin' ? '🔑 Admin' : '👤 Student'}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 24 }}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {tab === 'admin' ? (
              <form onSubmit={handleAdminLogin}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Admin Password</label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Login as Admin
                </button>
              </form>
            ) : (
              <form onSubmit={handleStudentLogin}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>MESS ID</label>
                  <input
                    value={messId}
                    onChange={e => setMessId(e.target.value)}
                    placeholder="MESS-001"
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Phone Number</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? <><span className="spinner" /> Checking…</> : 'Login as Student'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', marginTop: 16 }}>
          Students: use your MESS ID + phone number to login
        </p>
      </div>
    </div>
  );
}
