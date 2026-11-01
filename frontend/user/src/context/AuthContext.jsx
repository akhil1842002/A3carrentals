import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logoutUserApi, googleLogin } from '../api';

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

  // Listen for session expiry from axios refresh interceptor
  useEffect(() => {
    const onAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('user:auth-expired', onAuthExpired);
    return () => window.removeEventListener('user:auth-expired', onAuthExpired);
  }, []);

  useEffect(() => {
    // Check if returning from Google OAuth redirect (hash contains access_token)
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(res => res.json())
          .then(async (profile) => {
            if (profile?.email) {
              const res = await googleLogin({
                email: profile.email.toLowerCase(),
                name: profile.name || profile.email.split('@')[0],
                picture: profile.picture || '',
                googleId: profile.sub || ('g_' + Date.now())
              });
              login(res.data.token, res.data.user, res.data.refreshToken);
              window.location.href = '/dashboard?tab=overview';
            } else {
              setLoading(false);
            }
          })
          .catch((e) => {
            console.error('Google OAuth hash login failed:', e);
            setLoading(false);
          });
        return;
      }
    }

    const token = localStorage.getItem('carbook_token');
    const refreshToken = localStorage.getItem('carbook_refresh_token');
    if (token || refreshToken) {
      getMe()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('carbook_token');
          localStorage.removeItem('carbook_refresh_token');
          localStorage.removeItem('carbook_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, refreshToken) => {
    localStorage.setItem('carbook_token', token);
    if (refreshToken) {
      localStorage.setItem('carbook_refresh_token', refreshToken);
    }
    localStorage.setItem('carbook_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    const rfToken = localStorage.getItem('carbook_refresh_token');
    if (rfToken) {
      logoutUserApi(rfToken).catch(() => {});
    }
    localStorage.removeItem('carbook_token');
    localStorage.removeItem('carbook_refresh_token');
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

