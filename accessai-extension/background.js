/**
 * FILE: background.js
 * 1. WHAT: Background service worker for the extension.
 * 2. WHY: Handles events like context menu clicks and installation.
 * 3. HOW: Runs in the background of Chrome.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('AccessAI Extension Installed');
});
