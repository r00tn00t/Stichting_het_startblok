import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken, getToken } from '../api/client.js';

const AuthContext = createContext(null);

// Rol-rangorde, spiegelt de backend (config/roles.js).
const RANK = { vrijwilliger: 1, coordinator: 2, directie: 3 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Herstel sessie bij laden.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, wachtwoord) {
    const { token, user } = await api('/auth/login', {
      method: 'POST',
      body: { email, wachtwoord },
    });
    setToken(token);
    setUser(user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  // Mag de huidige gebruiker minimaal deze rol uitvoeren?
  const heeftRol = (minRol) => (RANK[user?.role] || 0) >= (RANK[minRol] || 0);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, heeftRol }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
