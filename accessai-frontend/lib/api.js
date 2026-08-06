'use client';

import axios from 'axios';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if variables exist to avoid crashing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : { auth: { getSession: async () => ({ data: { session: null } }), signOut: () => {} } };

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Fast token helper
export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessai_token') || null;
};

// Add token to every request if user is authenticated
api.interceptors.request.use(
  (config) => {
    try {
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Quietly ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessai_token');
        localStorage.removeItem('accessai_user');
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const signupUser = async (email, password, name = '') => {
  const response = await api.post('/api/auth/signup', { email, password, name });
  return response.data;
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/api/auth/logout');
    return response.data;
  } catch {
    return { success: true };
  }
};

export const getAuthSession = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const forgotPasswordUser = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordUser = async (token, password) => {
  const response = await api.post('/api/auth/reset-password', { token, password });
  return response.data;
};

// AI Processing APIs
export const processTextWithAI = async (text, type) => {
  try {
    const response = await api.post('/api/chat', { text, type });
    const resData = response.data;
    const resultText = resData?.data || resData?.result || (typeof resData === 'string' ? resData : '');
    
    if (!resultText) {
      throw new Error(resData?.error || 'Empty AI response received.');
    }
    return { success: true, data: resultText, result: resultText };
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.result || error.response?.data?.message || error.message || 'API request failed';
    console.error("AI API Fetch Error:", errorMsg);
    throw new Error(errorMsg);
  }
};

export const simplifyText = (text) => processTextWithAI(text, 'simplify');
export const explainText = (text) => processTextWithAI(text, 'explain');
export const summarizeText = (text) => processTextWithAI(text, 'summarize');

export const translateText = async (text, targetLanguage) => {
  try {
    const response = await api.post('/api/translate', { text, targetLanguage });
    const resData = response.data;
    const translatedResult = resData?.data || resData?.result || (typeof resData === 'string' ? resData : '');
    
    if (!translatedResult) {
      throw new Error(resData?.error || 'Translation unavailable.');
    }
    return { success: true, data: translatedResult, result: translatedResult };
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.result || error.response?.data?.message || error.message || 'Translation failed';
    console.error("Translate Error:", errorMsg);
    return { success: false, error: errorMsg, data: errorMsg };
  }
};

// Internet Companion APIs
export const analyzeCompanion = async (text, url) => {
  try {
    const response = await api.post('/api/companion/analyze', { text, url });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Companion analysis failed';
    return { success: false, error: errorMsg };
  }
};

export const chatCompanion = async (question, context) => {
  try {
    const response = await api.post('/api/companion/chat', { question, context });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Companion chat failed';
    return { success: false, error: errorMsg };
  }
};

// History APIs
export const getHistory = async () => {
  try {
    const response = await api.get('/api/history');
    return response.data;
  } catch {
    return { success: false, data: [] };
  }
};

export const saveHistory = async (type, inputText, outputText) => {
  try {
    const token = getStoredToken();
    if (!token) return { success: false, message: 'Unauthenticated' };
    
    const response = await api.post('/api/history/save', {
      type,
      input_text: inputText,
      output_text: outputText,
    });
    return response.data;
  } catch {
    return { success: false };
  }
};

export const deleteHistoryItem = async (id) => {
  const response = await api.delete(`/api/history/${id}`);
  return response.data;
};

export const clearAllHistory = async () => {
  const response = await api.delete('/api/history/all');
  return response.data;
};

// Settings APIs
export const getSettings = async () => {
  try {
    const response = await api.get('/api/settings');
    return response.data;
  } catch {
    return { success: false, data: {} };
  }
};

export const updateSettings = async (settings) => {
  const response = await api.put('/api/settings', settings);
  return response.data;
};

// User APIs
export const getProfile = async () => {
  const response = await api.get('/api/user/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/api/user/profile', data);
  return response.data;
};

export const updatePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/api/user/password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/api/user/account');
  return response.data;
};

// Organization APIs
export const runAudit = async (url) => {
  const response = await api.post('/api/org/audit', { url });
  return response.data;
};

export const getAudits = async () => {
  const response = await api.get('/api/org/audits');
  return response.data;
};

export default api;
