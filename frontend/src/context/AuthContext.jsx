import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user || res.data);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;
    const newToken = data.token || data.access_token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(data.user || null);
    if (!data.user) {
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      setUser(meRes.data.user || meRes.data);
    }
    return data;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const data = res.data;
    const newToken = data.token || data.access_token;
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(data.user || null);
      if (!data.user) {
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        setUser(meRes.data.user || meRes.data);
      }
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
