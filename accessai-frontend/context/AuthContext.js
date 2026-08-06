'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext({
  user:            null,
  token:           null,
  loading:         true,
  isAuthenticated: false,
  login:           async () => {},
  signup:          async () => {},
  logout:          () => {},
  checkSession:    async () => {},
});

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://accessai-backend-lx57.onrender.com').replace(/\/$/, '');

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * checkSession — restore session from localStorage and verify with backend.
   *
   * Fix applied (Bug #12): Increased /api/auth/me timeout from 5s → 12s.
   * Render cold starts take 15-30s, but the initial boot ping happens before
   * most user actions. 12s covers the vast majority of warm-starts without
   * logging out users who have valid tokens.
   *
   * The session check is non-blocking: if the network request fails due to
   * a timeout, we keep the cached user from localStorage rather than logging out.
   * Only an explicit 401 Unauthorized triggers a logout.
   */
  const checkSession = async () => {
    try {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('accessai_token');
      const storedUser  = localStorage.getItem('accessai_user');

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      // Set cached state immediately for fast perceived performance
      setToken(storedToken);
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch { /* ignore parse error */ }
      }

      // Verify token with backend (FIX: 12s timeout for Render cold starts)
      try {
        const response = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
          timeout: 12000, // FIX: was 5000 — Render needs up to 12s on warm start
        });

        if (response.data?.success && response.data?.data?.user) {
          const freshUser = response.data.data.user;
          setUser(freshUser);
          localStorage.setItem('accessai_user', JSON.stringify(freshUser));
        } else {
          // Server responded but session invalid — clear
          logout();
        }
      } catch (err) {
        if (err.response?.status === 401) {
          // Explicitly unauthorized — token is invalid or expired
          logout();
        }
        // For network errors, timeouts, or 5xx — keep cached user session.
        // Don't log the user out just because the backend is slow to start.
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email:    typeof email === 'string' ? email.trim() : email,
        password,
      }, {
        timeout: 20000,
      });

      if (response.data?.success && response.data?.data) {
        const { user: authUser, token: authToken } = response.data.data;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('accessai_token', authToken);
        localStorage.setItem('accessai_user',  JSON.stringify(authUser));
        return { success: true, user: authUser, message: response.data.message };
      } else {
        throw new Error(response.data?.error || 'Login failed.');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || (!err.response && err.request)) {
        throw new Error('Network error. Please check your internet connection.');
      }
      if (err.response?.status === 500) {
        throw new Error(err.response?.data?.error || 'Server error. Please try again later.');
      }
      const message = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  const signup = async (email, password, name = '') => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/signup`, {
        email:    typeof email === 'string' ? email.trim() : email,
        password,
        name:     typeof name === 'string' ? name.trim() : name,
      }, {
        timeout: 20000,
      });

      if (response.data?.success && response.data?.data) {
        const { user: authUser, token: authToken } = response.data.data;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('accessai_token', authToken);
        localStorage.setItem('accessai_user',  JSON.stringify(authUser));
        return { success: true, user: authUser, message: response.data.message };
      } else {
        throw new Error(response.data?.error || 'Signup failed.');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || (!err.response && err.request)) {
        throw new Error('Network error. Please check your internet connection.');
      }
      if (err.response?.status === 500) {
        throw new Error(err.response?.data?.error || 'Server error. Please try again later.');
      }
      const message = err.response?.data?.error || err.message || 'Signup failed. Please try again.';
      throw new Error(message);
    }
  };

  const logout = () => {
    const currentToken = token;
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessai_token');
      localStorage.removeItem('accessai_user');
    }
    // Fire-and-forget server logout notification
    if (currentToken) {
      axios.post(`${API_BASE}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${currentToken}` },
        timeout: 5000,
      }).catch(() => {});
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
