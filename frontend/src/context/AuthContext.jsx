import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('healthid_token'));
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
      setQrCode(res.data.qrCode);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('healthid_token', newToken);
    localStorage.setItem('healthid_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const { token: newToken, user: newUser, qrCode: newQr } = res.data;
    localStorage.setItem('healthid_token', newToken);
    localStorage.setItem('healthid_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setQrCode(newQr);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('healthid_token');
    localStorage.removeItem('healthid_user');
    setToken(null);
    setUser(null);
    setQrCode(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, token, qrCode, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
