'use client';

import axios from 'axios';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting session for API request:', error);
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
      // Token expired or invalid - user should re-login
      supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

// AI Processing APIs
export const processTextWithAI = async (text, type) => {
  try {
    const response = await api.post('/api/chat', { text, type });
    const data = response.data;
    if (!response.status.toString().startsWith('2')) {
      throw new Error(data.reply || data.message || 'API error');
    }
    console.log("API RESPONSE:", data);
    return data;
  } catch (error) {
    if (error.response?.data?.reply) {
      throw new Error(error.response.data.reply);
    }
    throw error;
  }
};

export const simplifyText = (text) => processTextWithAI(text, 'simplify');
export const explainText = (text) => processTextWithAI(text, 'explain');
export const summarizeText = (text) => processTextWithAI(text, 'summarize');
export const generateAltText = (text) => processTextWithAI(text, 'alttext');

export const translateText = async (text, targetLanguage) => {
  try {
    const response = await api.post('/api/translate', { text, targetLanguage });
    const data = response.data;
    console.log("TRANSLATE RESPONSE:", data);
    return data;
  } catch (error) {
    if (error.response?.data?.data) {
      throw new Error(error.response.data.data);
    }
    throw error;
  }
};

// History APIs
export const getHistory = async () => {
  const response = await api.get('/api/history');
  return response.data;
};

export const saveHistory = async (type, inputText, outputText) => {
  const response = await api.post('/api/history/save', {
    type,
    input_text: inputText,
    output_text: outputText,
  });
  return response.data;
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
  const response = await api.get('/api/settings');
  return response.data;
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

export const updateProfile = async (email) => {
  const response = await api.put('/api/user/profile', { email });
  return response.data;
};

export const updatePassword = async (password) => {
  const response = await api.put('/api/user/password', { password });
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
