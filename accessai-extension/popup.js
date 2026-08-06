/**
 * popup.js — AccessAI Extension Toolbar Popup
 * Checks service readiness and displays active status.
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusLabel = document.getElementById('aai-status-label');

  // Verify extension background worker is reachable
  if (chrome.runtime?.id) {
    chrome.runtime.sendMessage({ action: 'getAuthState' }, (response) => {
      if (chrome.runtime.lastError) {
        // Fallback gracefully
        if (statusLabel) statusLabel.textContent = 'Active on all pages';
        return;
      }
      if (statusLabel) {
        if (response?.isAuthenticated && response?.user?.name) {
          statusLabel.textContent = `Connected as ${response.user.name}`;
        } else {
          statusLabel.textContent = 'Active on all pages';
        }
      }
    });
  }
});
