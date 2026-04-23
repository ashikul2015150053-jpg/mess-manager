import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem('isAdmin') === 'true'
  );
  const [studentSession, setStudentSession] = useState(
    () => {
      const s = sessionStorage.getItem('studentSession');
      return s ? JSON.parse(s) : null;
    }
  );

  function loginAdmin(password) {
    const adminPass = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (password === adminPass) {
      sessionStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  }

  function loginStudent(student) {
    sessionStorage.setItem('studentSession', JSON.stringify(student));
    setStudentSession(student);
  }

  function logout() {
    sessionStorage.clear();
    setIsAdmin(false);
    setStudentSession(null);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, studentSession, loginAdmin, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
