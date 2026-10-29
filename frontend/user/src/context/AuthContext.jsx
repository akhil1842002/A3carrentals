import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const defaultAuthValue = {
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  setUser: () => {},
  isAuthenticated: false
};

const AuthContext = createContext(defaultAuthValue);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('carbook_token');
    if (token) {
      getMe()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('carbook_token');
          localStorage.removeItem('carbook_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('carbook_token', token);
    localStorage.setItem('carbook_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('carbook_token');
    localStorage.removeItem('carbook_user');
    localStorage.removeItem('userActiveTab');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => {
      const merged = { ...prev, ...userData };
      localStorage.setItem('carbook_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, setUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthValue;
}

