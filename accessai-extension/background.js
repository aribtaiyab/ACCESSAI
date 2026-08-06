/**
 * background.js — AccessAI Extension Service Worker (Premium Edition)
 *
 * Handles API calls for:
 *   - simplify / explain / summarize / translate  (EXISTING — untouched)
 *   - askPage  (NEW — Voice Page Assistant)
 *
 * MV3-safe: uses return true for async sendResponse.
 */

// ── Keep-Alive: Prevents Service Worker from sleeping ─────────────────────────
const keepAlive = () => {
  setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {});
  }, 20000);
};
keepAlive();

// ── Main Message Handler ──────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[AccessAI] Action: ${request?.action}`);

  (async () => {
    try {
      const API_HOST = 'http://127.0.0.1:5000';
      const API_BASE = `${API_HOST}/api`;

      // ── Standard text-tool routes (UNCHANGED) ───────────────────────────
      const textRoutes = {
        simplify:  '/simplify',
        explain:   '/explain',
        summarize: '/summarize',
        translate: '/translate',
      };

      // ── Voice / Page assistant ───────────────────────────────────────────
      if (request?.action === 'askPage') {
        const { question, pageContext, pageTitle, pageUrl } = request;

        if (!question?.trim()) {
          sendResponse({ error: 'No question provided.' });
          return;
        }

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(`${API_BASE}/ask-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json',
          },
          body: JSON.stringify({ question, pageContext, pageTitle, pageUrl }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[AccessAI] ask-page error (${res.status}):`, errText);
          sendResponse({ error: `Server error ${res.status}` });
          return;
        }

        const data = await res.json();
        if (data?.result) {
          sendResponse({ result: data.result });
        } else {
          sendResponse({ error: 'Malformed response from server' });
        }
        return;
      }

      // ── Standard text tools ──────────────────────────────────────────────
      if (!request?.action || !textRoutes[request.action]) {
        console.error('[AccessAI] Invalid action:', request?.action);
        sendResponse({ error: 'Invalid action' });
        return;
      }

      const url        = `${API_BASE}${textRoutes[request.action]}`;
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body: JSON.stringify({
          text:           request.text,
          targetLanguage: request.targetLanguage || 'English',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AccessAI] API Error (${response.status}):`, errorText);
        sendResponse({ error: `Server returned ${response.status}` });
        return;
      }

      const data = await response.json();
      console.log('[AccessAI] Success:', data);

      if (data?.result) {
        sendResponse({ result: data.result });
      } else {
        console.error('[AccessAI] Malformed response:', data);
        sendResponse({ error: 'Malformed response from server' });
      }

    } catch (err) {
      console.error('[AccessAI] Request failed:', err);
      let errorMessage = 'Connection failed';
      if (err.name === 'AbortError') errorMessage = 'Request timeout (30s)';
      else if (err.message?.includes('Failed to fetch')) errorMessage = 'Cannot reach backend (Check port 5000)';
      sendResponse({ error: errorMessage });
    }
  })();

  return true; // CRITICAL: async response
});