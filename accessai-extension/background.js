/**
 * background.js - AccessAI Extension (Expert Edition)
 * Optimized for MV3 reliability and persistent connections.
 */

// 1. Keep-Alive: Prevents the Service Worker from falling asleep
const keepAlive = () => {
  setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {});
  }, 20000);
};
keepAlive();

// 2. Main Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[AccessAI] Action: ${request?.action}`);

  // Use an IIFE for async processing
  (async () => {
    try {
      // Config
      const API_HOST = "http://localhost:5000";
      const API_BASE = `${API_HOST}/api`;
      
      const routes = {
        simplify: "/simplify",
        explain: "/explain",
        summarize: "/summarize",
        translate: "/translate"
      };

      if (!request?.action || !routes[request.action]) {
        console.error("[AccessAI] Invalid action:", request?.action);
        sendResponse({ error: "Invalid action" });
        return;
      }

      const url = `${API_BASE}${routes[request.action]}`;
      console.log(`[AccessAI] Fetching: ${url}`);

      // Fetch with AbortController for custom timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          text: request.text,
          targetLanguage: request.targetLanguage || "English"
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AccessAI] API Error (${response.status}):`, errorText);
        sendResponse({ error: `Server returned ${response.status}` });
        return;
      }

      const data = await response.json();
      console.log("[AccessAI] Success:", data);

      if (data && data.result) {
        sendResponse({ result: data.result });
      } else {
        console.error("[AccessAI] Malformed response:", data);
        sendResponse({ error: "Malformed response from server" });
      }

    } catch (err) {
      console.error("[AccessAI] Request failed:", err);
      
      let errorMessage = "Connection failed";
      if (err.name === 'AbortError') errorMessage = "Request timeout (30s)";
      else if (err.message.includes('Failed to fetch')) errorMessage = "Cannot reach backend (Check port 5000)";
      
      sendResponse({ error: errorMessage });
    }
  })();

  return true; // CRITICAL: Tells Chrome we will respond asynchronously
});