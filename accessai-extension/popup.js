/**
 * popup.js — AccessAI Extension Popup Logic
 * Lightweight: just checks the extension is alive and logs load.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[AccessAI] Popup loaded');

  // Verify content script is available on active tab (non-critical, silent)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.[0]?.id) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => typeof window.__accessaiLoaded !== 'undefined',
    }).catch(() => {
      // Silently ignore — extension may not be injected on this tab type
    });
  });
});
