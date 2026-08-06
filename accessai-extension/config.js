/**
 * config.js — AccessAI Extension Centralized Configuration
 * 
 * IMPORTANT: This file is loaded as a NON-MODULE content script (plain JS).
 * Do NOT use ES module syntax (export/import) here.
 * background.js (which IS a module) imports its own inline config.
 * This file exposes CONFIG via window.AccessAIConfig for content.js.
 */

(function () {
  'use strict';

  var CONFIG = {
    // Production Backend & Frontend Endpoints
    API_HOST: 'https://accessai-backend-lx57.onrender.com',
    API_BASE: 'https://accessai-backend-lx57.onrender.com/api',
    FRONTEND_URL: 'https://accessai-frontend.vercel.app',

    // Request Timeouts
    TIMEOUT_MS: 30000,
    RENDER_WARMUP_NOTICE_MS: 4500,

    // API Route Paths
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

    // chrome.storage Keys
    STORAGE_KEYS: {
      AUTH_TOKEN: 'accessai_auth_token',
      USER_INFO: 'accessai_user_info',
      TRANSLATE_LANG: 'accessai_translate_lang',
      SETTINGS: 'accessai_settings',
    },

    // Defaults
    DEFAULT_LANG: 'Hindi',
    MAX_CONTEXT_LENGTH: 4000,
    MAX_QUESTION_LENGTH: 500,
  };

  // Expose globally for content.js (which runs in the same non-module context)
  if (typeof window !== 'undefined') {
    window.AccessAIConfig = CONFIG;
  }
})();
