import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Dues from './pages/Dues';
import Rooms from './pages/Rooms';
import Notices from './pages/Notices';
import StudentPortal from './pages/StudentPortal';

function ProtectedAdmin({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" />;
}

function ProtectedStudent({ children }) {
  const { studentSession } = useAuth();
  return studentSession ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const titles = {
    '/': 'Dashboard', '/students': 'Students', '/payments': 'Payments',
    '/dues': 'Dues Tracker', '/rooms': 'Rooms', '/notices': 'Notices',
    '/portal': 'My Portal', '/portal/pay': 'Pay Rent',
  };
  const title = titles[location.pathname] || 'Mess Manager';

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger for mobile */}
            <button
              className="btn btn-icon"
              style={{ display: 'none' }}
              id="hamburger"
              onClick={() => setSidebarOpen(true)}
            >☰</button>
            <h1>{title}</h1>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              {new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) { #hamburger { display: flex !important; } }
      `}</style>
    </div>
  );
}

export default function App() {
  const { isAdmin, studentSession } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAdmin ? <Navigate to="/" /> :
        studentSession ? <Navigate to="/portal" /> :
        <Login />
      } />

      {/* Admin routes */}
      <Route path="/" element={<ProtectedAdmin><Layout><Dashboard /></Layout></ProtectedAdmin>} />
      <Route path="/students" element={<ProtectedAdmin><Layout><Students /></Layout></ProtectedAdmin>} />
      <Route path="/payments" element={<ProtectedAdmin><Layout><Payments /></Layout></ProtectedAdmin>} />
      <Route path="/dues" element={<ProtectedAdmin><Layout><Dues /></Layout></ProtectedAdmin>} />
      <Route path="/rooms" element={<ProtectedAdmin><Layout><Rooms /></Layout></ProtectedAdmin>} />
      <Route path="/notices" element={
        <Layout>
          {isAdmin ? <Notices /> : studentSession ? <Notices /> : <Navigate to="/login" />}
        </Layout>
      } />

      {/* Student routes */}
      <Route path="/portal" element={<ProtectedStudent><Layout><StudentPortal /></Layout></ProtectedStudent>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAdmin ? "/" : studentSession ? "/portal" : "/login"} />} />
    </Routes>
  );
}
