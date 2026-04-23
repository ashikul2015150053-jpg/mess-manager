import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/students', label: 'Students', icon: '👥' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/dues', label: 'Dues Tracker', icon: '⚠️' },
  { to: '/rooms', label: 'Rooms', icon: '🏠' },
  { to: '/notices', label: 'Notices', icon: '📢' },
  { to: '/registrations', label: 'Registrations', icon: '📋' },
];

const studentNav = [
  { to: '/portal', label: 'My Portal', icon: '🏠' },
  { to: '/notices', label: 'Notices', icon: '📢' },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin, studentSession, logout } = useAuth();
  const nav = isAdmin ? adminNav : studentNav;

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
        />
      )}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>🏠 Mess Manager</h2>
          <p>Rangpur Student Mess</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">{isAdmin ? 'Admin' : 'Student'}</div>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isAdmin ? (
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>Admin</div>
          ) : studentSession ? (
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
              {studentSession.name}<br />
              <span style={{ fontFamily: 'DM Mono' }}>{studentSession.mess_id}</span>
            </div>
          ) : null}
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
