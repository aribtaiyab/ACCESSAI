/**
 * FILE: context/AuthContext.js
 * 
 * 1. WHAT: Client-side authentication context and state provider.
 * 2. WHY: Manages login, signup, session persistence across page refreshes, and logout.
 * 3. HOW: Uses localStorage for token caching and validates with backend /api/auth/me.
 */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  checkSession: async () => {},
});

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check session from localStorage on load
  const checkSession = async () => {
    try {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('accessai_token');
      const storedUser = localStorage.getItem('accessai_user');

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Ignore parse error
        }
      }

      // Verify token with backend
      const response = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
        timeout: 5000,
      });

      if (response.data?.success && response.data?.data?.user) {
        const freshUser = response.data.data.user;
        setUser(freshUser);
        localStorage.setItem('accessai_user', JSON.stringify(freshUser));
      } else {
        logout();
      }
    } catch (err) {
      // If unauthorized, clear invalid session
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      if (response.data?.success && response.data?.data) {
        const { user: authUser, token: authToken } = response.data.data;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('accessai_token', authToken);
        localStorage.setItem('accessai_user', JSON.stringify(authUser));
        return { success: true, user: authUser };
      } else {
        throw new Error(response.data?.error || 'Login failed.');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  const signup = async (email, password, name = '') => {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/signup`, {
        email,
        password,
        name,
      });

      if (response.data?.success && response.data?.data) {
        const { user: authUser, token: authToken } = response.data.data;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('accessai_token', authToken);
        localStorage.setItem('accessai_user', JSON.stringify(authUser));
        return { success: true, user: authUser };
      } else {
        throw new Error(response.data?.error || 'Signup failed.');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Signup failed. Please try again.';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessai_token');
      localStorage.removeItem('accessai_user');
    }
    // Fire and forget server logout notification
    if (token) {
      axios.post(`${API_BASE}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
