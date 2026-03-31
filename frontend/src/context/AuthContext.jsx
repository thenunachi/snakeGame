import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('snake_token');
    const stored = localStorage.getItem('snake_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
      // Validate token with server
      api.get('/api/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('snake_token');
          localStorage.removeItem('snake_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('snake_token', res.data.token);
    localStorage.setItem('snake_user', JSON.stringify({ username: res.data.username }));
    setUser({ username: res.data.username });
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/api/auth/register', { username, email, password });
    localStorage.setItem('snake_token', res.data.token);
    localStorage.setItem('snake_user', JSON.stringify({ username: res.data.username }));
    setUser({ username: res.data.username });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('snake_token');
    localStorage.removeItem('snake_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
