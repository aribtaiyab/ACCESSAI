/**
 * background.js — AccessAI Extension Service Worker (Production Edition)
 *
 * Manifest V3 ES Module Service Worker.
 * Handles all API communication between content scripts and the AccessAI backend.
 *
 * Fixes applied:
 *   - navigator.onLine removed (does not exist in MV3 Service Workers → ReferenceError)
 *   - getAuthState fully async-safe (no storage callbacks escaping async IIFE scope)
 *   - All sendResponse calls happen inside the async IIFE, guaranteed before port closes
 */

// ── Inline Config for Service Worker (ES Module) ─────────────────────────────
// config.js is a plain content script and cannot be imported here.
// The background worker maintains its own config object.
const CONFIG = {
  API_BASE: 'https://accessai-backend-lx57.onrender.com/api',
  TIMEOUT_MS: 30000,
  ROUTES: {
    simplify: '/simplify',
    explain: '/explain',
    summarize: '/summarize',
    translate: '/translate',
    askPage: '/ask-page',
    login: '/auth/login',
    signup: '/auth/signup',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  STORAGE_KEYS: {
    AUTH_TOKEN: 'accessai_auth_token',
    USER_INFO: 'accessai_user_info',
    TRANSLATE_LANG: 'accessai_translate_lang',
  },
  DEFAULT_LANG: 'Hindi',
  MAX_CONTEXT_LENGTH: 4000,
  MAX_QUESTION_LENGTH: 500,
};

// ── Lifecycle: Extension Installation & Updates ───────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.get([CONFIG.STORAGE_KEYS.TRANSLATE_LANG], (res) => {
      if (!res[CONFIG.STORAGE_KEYS.TRANSLATE_LANG]) {
        chrome.storage.sync.set({
          [CONFIG.STORAGE_KEYS.TRANSLATE_LANG]: CONFIG.DEFAULT_LANG,
        });
      }
    });
  }
});

// ── Promise-wrapped Storage Helpers ──────────────────────────────────────────
function storageLocalGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
}

function storageSyncGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => resolve(result || {}));
  });
}

// ── Auth Token Helper ─────────────────────────────────────────────────────────
async function getStoredAuthToken() {
  const localRes = await storageLocalGet([CONFIG.STORAGE_KEYS.AUTH_TOKEN]);
  if (localRes[CONFIG.STORAGE_KEYS.AUTH_TOKEN]) {
    return localRes[CONFIG.STORAGE_KEYS.AUTH_TOKEN];
  }
  const syncRes = await storageSyncGet([CONFIG.STORAGE_KEYS.AUTH_TOKEN]);
  return syncRes[CONFIG.STORAGE_KEYS.AUTH_TOKEN] || null;
}

// ── Safe JSON Response Parser ──────────────────────────────────────────────────
async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await response.text();
    return { result: text, message: text };
  } catch {
    return null;
  }
}

// ── Central Message Listener ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const action = request?.action;
      if (!action) {
        sendResponse({ error: 'No action specified' });
        return;
      }

      // ── 1. Auth Status Check ───────────────────────────────────────────────
      // FIX: Fully async — storage read is awaited inside async IIFE before sendResponse
      if (action === 'getAuthState') {
        const token = await getStoredAuthToken();
        const localRes = await storageLocalGet([CONFIG.STORAGE_KEYS.USER_INFO]);
        sendResponse({
          isAuthenticated: Boolean(token),
          token: token || null,
          user: localRes[CONFIG.STORAGE_KEYS.USER_INFO] || null,
        });
        return;
      }

      // ── 2. User Login ──────────────────────────────────────────────────────
      if (action === 'login') {
        const { email, password } = request;
        if (!email || !password) {
          sendResponse({ error: 'Email and password are required.' });
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

        try {
          const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ROUTES.login}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await parseResponseBody(res);
          if (!res.ok) {
            sendResponse({ error: data?.error || `Login failed (${res.status})` });
            return;
          }

          const token = data?.data?.token || data?.data?.access_token || data?.token;
          const user  = data?.data?.user  || data?.user;

          if (token) {
            await chrome.storage.local.set({
              [CONFIG.STORAGE_KEYS.AUTH_TOKEN]: token,
              [CONFIG.STORAGE_KEYS.USER_INFO]:  user || null,
            });
            sendResponse({ success: true, token, user });
          } else {
            sendResponse({ error: 'Invalid login response from server.' });
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          sendResponse({ error: getFriendlyErrorMessage(fetchErr) });
        }
        return;
      }

      // ── 3. User Signup ─────────────────────────────────────────────────────
      if (action === 'signup') {
        const { email, password, name } = request;
        if (!email || !password) {
          sendResponse({ error: 'Email and password are required.' });
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

        try {
          const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ROUTES.signup}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password, name: name?.trim() }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await parseResponseBody(res);
          if (!res.ok) {
            sendResponse({ error: data?.error || `Signup failed (${res.status})` });
            return;
          }

          const token = data?.data?.token || data?.data?.access_token || data?.token;
          const user  = data?.data?.user  || data?.user;

          if (token) {
            await chrome.storage.local.set({
              [CONFIG.STORAGE_KEYS.AUTH_TOKEN]: token,
              [CONFIG.STORAGE_KEYS.USER_INFO]:  user || null,
            });
            sendResponse({ success: true, token, user });
          } else {
            sendResponse({ error: 'Invalid signup response from server.' });
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          sendResponse({ error: getFriendlyErrorMessage(fetchErr) });
        }
        return;
      }

      // ── 4. User Logout ─────────────────────────────────────────────────────
      if (action === 'logout') {
        await chrome.storage.local.remove([
          CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          CONFIG.STORAGE_KEYS.USER_INFO,
        ]);
        sendResponse({ success: true });
        return;
      }

      // ── 5. Voice / Ask Page Assistant ─────────────────────────────────────
      if (action === 'askPage') {
        const { question, pageContext, pageTitle, pageUrl } = request;

        if (!question?.trim()) {
          sendResponse({ error: 'Please provide a question.' });
          return;
        }

        const token = await getStoredAuthToken();
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

        try {
          const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ROUTES.askPage}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              question:    question.trim().slice(0, CONFIG.MAX_QUESTION_LENGTH),
              pageContext: (pageContext || '').slice(0, CONFIG.MAX_CONTEXT_LENGTH),
              pageTitle:   pageTitle || '',
              pageUrl:     pageUrl || '',
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.status === 401 && token) {
            await chrome.storage.local.remove([CONFIG.STORAGE_KEYS.AUTH_TOKEN]);
          }

          if (!res.ok) {
            const data = await parseResponseBody(res);
            sendResponse({ error: getHttpErrorMessage(res.status, data) });
            return;
          }

          const data = await res.json();
          sendResponse({ result: data?.result || data?.data || 'No answer received.' });
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          sendResponse({ error: getFriendlyErrorMessage(fetchErr) });
        }
        return;
      }

      // ── 6. AI Text Tools (Simplify, Explain, Summarize, Translate) ──────────
      const textRoutes = {
        simplify:  CONFIG.ROUTES.simplify,
        explain:   CONFIG.ROUTES.explain,
        summarize: CONFIG.ROUTES.summarize,
        translate: CONFIG.ROUTES.translate,
      };

      if (!textRoutes[action]) {
        sendResponse({ error: `Unknown action: ${action}` });
        return;
      }

      const token = await getStoredAuthToken();
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

      try {
        const res = await fetch(`${CONFIG.API_BASE}${textRoutes[action]}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text:           request.text,
            targetLanguage: request.targetLanguage || CONFIG.DEFAULT_LANG,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 401 && token) {
          await chrome.storage.local.remove([CONFIG.STORAGE_KEYS.AUTH_TOKEN]);
        }

        if (!res.ok) {
          const data = await parseResponseBody(res);
          sendResponse({ error: getHttpErrorMessage(res.status, data) });
          return;
        }

        const data = await res.json();

        if (data?.result || data?.data) {
          sendResponse({ result: data.result || data.data });
        } else {
          sendResponse({ error: 'Malformed response received from server.' });
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        sendResponse({ error: getFriendlyErrorMessage(fetchErr) });
      }

    } catch (unexpectedErr) {
      sendResponse({ error: unexpectedErr?.message || 'Internal extension error.' });
    }
  })();

  return true; // Keep message channel open for async response
});

// ── HTTP Error Message Mapper ─────────────────────────────────────────────────
function getHttpErrorMessage(status, data) {
  if (data?.error && typeof data.error === 'string') return data.error;
  if (data?.message && typeof data.message === 'string') return data.message;
  switch (status) {
    case 400: return 'Invalid request format.';
    case 401: return 'Session expired. Please log in again.';
    case 403: return 'Access denied.';
    case 404: return 'AI endpoint not found.';
    case 429: return 'Too many requests. Please wait a moment and retry.';
    case 500:
    case 502:
    case 503:
    case 504: return 'AI service is temporarily warming up. Please try again in a moment.';
    default:  return `Server error (${status}). Please retry.`;
  }
}

// ── Fetch Error → Friendly Message ───────────────────────────────────────────
// FIX: navigator.onLine does NOT exist in MV3 Service Workers — removed entirely.
// We use error.name and error.message patterns instead.
function getFriendlyErrorMessage(err) {
  if (!err) return 'Connection failed. Please retry.';
  if (err.name === 'AbortError') {
    return 'Request timed out. The server may be warming up — please retry.';
  }
  const msg = err.message || '';
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ERR_NETWORK') ||
    msg.includes('net::') ||
    msg.includes('ECONNREFUSED')
  ) {
    return 'Cannot connect to AccessAI service. Please check your internet connection.';
  }
  return msg || 'Connection failed. Please retry.';
}