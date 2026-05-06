/**
 * content.js — AccessAI Extension Content Script
 *
 * WHY NEEDED: This script runs directly inside the user's web page.
 * It detects text selection, shows the floating button, and renders
 * the result popup — all without page reload or navigation.
 */

// ── State ────────────────────────────────────────────────────────────────────
let selectedText   = '';
let floatBtn       = null;
let popup          = null;
let activeMode     = 'simplify';
let resultCache    = { simplify: '', explain: '', summarize: '' };
let speaking       = false;
let translateLang  = 'Hindi';
let langMenuOpen   = false;

// ── Full language list ────────────────────────────────────────────────────────
const LANGUAGE_GROUPS = [
  { label: '🌏 South Asian', langs: ['Hindi','Urdu','Bengali','Tamil','Telugu','Kannada','Gujarati','Punjabi','Malayalam','Odia','Marathi','Nepali','Sinhala','Assamese','Maithili'] },
  { label: '🌍 African',     langs: ['Swahili','Amharic','Hausa','Yoruba','Igbo','Zulu','Xhosa','Shona','Somali','Afrikaans'] },
  { label: '🌎 European',    langs: ['French','Spanish','Portuguese','Italian','German','Dutch','Russian','Polish','Ukrainian','Greek','Romanian','Czech','Slovak','Swedish','Norwegian','Danish','Finnish','Hungarian','Bulgarian','Croatian','Serbian','Slovenian','Lithuanian','Latvian','Estonian','Albanian','Macedonian','Bosnian'] },
  { label: '🕌 Middle Eastern', langs: ['Arabic','Persian','Turkish','Hebrew','Kurdish','Pashto','Azerbaijani','Georgian','Armenian'] },
  { label: '🏯 East Asian',  langs: ['Chinese','Japanese','Korean','Mongolian','Tibetan'] },
  { label: '🌺 Southeast Asian', langs: ['Indonesian','Malay','Thai','Vietnamese','Filipino','Burmese','Khmer','Lao','Javanese'] },
  { label: '🌐 Other',       langs: ['English','Latin','Esperanto','Welsh','Irish','Basque','Catalan','Galician','Maltese'] },
];

// ── BCP-47 language codes for Web Speech API ───────────────────────────────────
const LANG_CODE_MAP = {
  // South Asian
  Hindi: 'hi-IN', Urdu: 'ur-PK', Bengali: 'bn-IN', Tamil: 'ta-IN',
  Telugu: 'te-IN', Kannada: 'kn-IN', Gujarati: 'gu-IN', Punjabi: 'pa-IN',
  Malayalam: 'ml-IN', Odia: 'or-IN', Marathi: 'mr-IN', Nepali: 'ne-NP',
  Sinhala: 'si-LK', Assamese: 'as-IN', Maithili: 'mai-IN',
  // African
  Swahili: 'sw-KE', Amharic: 'am-ET', Hausa: 'ha-NG', Yoruba: 'yo-NG',
  Igbo: 'ig-NG', Zulu: 'zu-ZA', Xhosa: 'xh-ZA', Shona: 'sn-ZW',
  Somali: 'so-SO', Afrikaans: 'af-ZA',
  // European
  French: 'fr-FR', Spanish: 'es-ES', Portuguese: 'pt-PT', Italian: 'it-IT',
  German: 'de-DE', Dutch: 'nl-NL', Russian: 'ru-RU', Polish: 'pl-PL',
  Ukrainian: 'uk-UA', Greek: 'el-GR', Romanian: 'ro-RO', Czech: 'cs-CZ',
  Slovak: 'sk-SK', Swedish: 'sv-SE', Norwegian: 'nb-NO', Danish: 'da-DK',
  Finnish: 'fi-FI', Hungarian: 'hu-HU', Bulgarian: 'bg-BG', Croatian: 'hr-HR',
  Serbian: 'sr-RS', Slovenian: 'sl-SI', Lithuanian: 'lt-LT', Latvian: 'lv-LV',
  Estonian: 'et-EE', Albanian: 'sq-AL', Macedonian: 'mk-MK', Bosnian: 'bs-BA',
  // Middle Eastern
  Arabic: 'ar-SA', Persian: 'fa-IR', Turkish: 'tr-TR', Hebrew: 'he-IL',
  Kurdish: 'ku-TR', Pashto: 'ps-AF', Azerbaijani: 'az-AZ',
  Georgian: 'ka-GE', Armenian: 'hy-AM',
  // East Asian
  Chinese: 'zh-CN', Japanese: 'ja-JP', Korean: 'ko-KR',
  Mongolian: 'mn-MN', Tibetan: 'bo-CN',
  // Southeast Asian
  Indonesian: 'id-ID', Malay: 'ms-MY', Thai: 'th-TH', Vietnamese: 'vi-VN',
  Filipino: 'fil-PH', Burmese: 'my-MM', Khmer: 'km-KH',
  Lao: 'lo-LA', Javanese: 'jv-ID',
  // Other
  English: 'en-US', Latin: 'la', Esperanto: 'eo', Welsh: 'cy-GB',
  Irish: 'ga-IE', Basque: 'eu-ES', Catalan: 'ca-ES',
  Galician: 'gl-ES', Maltese: 'mt-MT',
};

if (!chrome.runtime?.id) {
  console.warn("Extension reloaded");
  hideAll();
}

// ── Safe Message Wrapper ──────────────────────────────────────────────────────
function safeSendMessage(payload) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: "Extension restarted. Retry." });
        } else {
          resolve(response || { error: "No response" });
        }
      });
    } catch {
      resolve({ error: "Failed to send message" });
    }
  });
}


// ── Detect text selection ─────────────────────────────────────────────────────
document.addEventListener('mouseup', (e) => {
  // Ignore clicks inside our own UI
  if (e.target.closest('#accessai-btn') || e.target.closest('#accessai-popup')) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (text && text.length > 2) {
    // Only reset and pre-fetch if it's a NEW selection
    if (selectedText !== text) {
      selectedText = text;
      resultCache = { simplify: '', explain: '', summarize: '' };
      
      // Speculative Pre-fetch: start simplifying in the background immediately
      safeSendMessage({ action: 'simplify', text: selectedText }).then((response) => {
        if (!response?.error && response?.result) {
          resultCache['simplify'] = response.result;
          // If the popup is already open and waiting for simplify, show it
          if (popup && activeMode === 'simplify') {
            showResult(response.result);
          }
        }
      });
    }
    showFloatButton(e.clientX, e.clientY);
  } else {
    hideAll();
  }
});

// Close popup when clicking outside
document.addEventListener('mousedown', (e) => {
  try {
    if (
      popup && !popup.contains(e.target) &&
      floatBtn && !floatBtn.contains(e.target)
    ) {
      hideAll();
    }
  } catch (err) {
    console.error("UI error:", err);
  }
});

// ── Floating Button ───────────────────────────────────────────────────────────
function showFloatButton(x, y) {
  removeElement(floatBtn);

  floatBtn = document.createElement('div');
  floatBtn.id = 'accessai-btn';
  floatBtn.innerHTML = '⚡ AccessAI';
  floatBtn.title = 'Click to simplify selected text';

  // Position near the selection
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  floatBtn.style.left = `${Math.min(x + scrollX, window.innerWidth + scrollX - 140)}px`;
  floatBtn.style.top  = `${y + scrollY + 14}px`;

  floatBtn.addEventListener('click', () => {
    activeMode = 'simplify';
    showPopup(x, y);
    
    // If pre-fetch already finished, show it immediately!
    if (resultCache['simplify']) {
      showResult(resultCache['simplify']);
    } else {
      fetchResult('simplify');
    }
  });

  document.body.appendChild(floatBtn);
}

// ── Popup ────────────────────────────────────────────────────────────────────
function showPopup(x, y) {
  removeElement(popup);
  speaking = false;

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  popup = document.createElement('div');
  popup.id = 'accessai-popup';

  // Smart position — keep inside viewport
  const popupW = 340;
  const left = Math.min(x + scrollX, window.innerWidth + scrollX - popupW - 16);

  popup.style.left = `${left}px`;
  popup.style.top  = `${y + scrollY + 46}px`;

  popup.innerHTML = buildPopupHTML();
  document.body.appendChild(popup);

  setTimeout(() => {
    if (!popup || !document.body.contains(popup)) return;
    const loader = popup.querySelector('#accessai-loader');
    const result = popup.querySelector('#accessai-result');
    if (loader && loader.style.display !== 'none' && result && result.style.display === 'none') {
      showResult("⚠️ Slow network. Try again.");
    }
  }, 20000);

  // Wire tab buttons
  popup.querySelectorAll('.accessai-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === activeMode) return;
      activeMode = mode;
      updateActiveTabs();
      if (resultCache[mode]) {
        showResult(resultCache[mode]);
      } else {
        fetchResult(mode);
      }
    });
  });

  // Speak button
  popup.querySelector('#accessai-speak')?.addEventListener('click', handleSpeak);

  // Translate button — toggle language menu
  popup.querySelector('#accessai-translate')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLangMenu();
  });

  // Close button
  popup.querySelector('#accessai-close')?.addEventListener('click', hideAll);

  // Remove the float button now that popup is open
  removeElement(floatBtn);
  floatBtn = null;
}

function buildPopupHTML() {
  return `
    <div class="accessai-header">
      <div class="accessai-tabs">
        <button class="accessai-tab active" data-mode="simplify">Simplify</button>
        <button class="accessai-tab" data-mode="explain">Explain</button>
        <button class="accessai-tab" data-mode="summarize">Summary</button>
      </div>
      <button id="accessai-close" title="Close">✕</button>
    </div>
    <div class="accessai-body">
      <div id="accessai-loader" class="accessai-loader">
        <span class="accessai-spinner"></span>
        <span class="accessai-loader-text">Simplifying…</span>
      </div>
      <div id="accessai-result" class="accessai-result" style="display:none;"></div>
    </div>
    <div class="accessai-footer">
      <button id="accessai-speak" title="Speak result">🔊 Speak</button>
      <div class="accessai-translate-wrap">
        <button id="accessai-translate" title="Translate result">🌐 Translate ▾</button>
        <div id="accessai-lang-menu" class="accessai-lang-menu" style="display:none;">
          <div class="accessai-lang-search-wrap">
            <input id="accessai-lang-search" class="accessai-lang-search" type="text" placeholder="🔍 Search language…" />
          </div>
          <div id="accessai-lang-list" class="accessai-lang-list"></div>
        </div>
      </div>
    </div>
  `;
}

// ── Tab State ─────────────────────────────────────────────────────────────────
function updateActiveTabs() {
  if (!popup) return;
  popup.querySelectorAll('.accessai-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === activeMode);
  });
  const loaderText = popup.querySelector('.accessai-loader-text');
  if (loaderText) {
    const labels = { simplify: 'Simplifying…', explain: 'Explaining…', summarize: 'Summarizing…' };
    loaderText.textContent = labels[activeMode] || 'Processing…';
  }
}

// ── Fetch AI Result ───────────────────────────────────────────────────────────
async function fetchResult(mode) {
  showLoader(mode);

  let response = await safeSendMessage({
    action: mode,
    text: selectedText
  });

  if (response?.error) {
    // Retry once automatically
    response = await safeSendMessage({
      action: mode,
      text: selectedText
    });
  }

  if (!response || response.error) {
    const errorMsg = response?.error || "Connection lost. Click again.";
    showResult(`⚠️ ${errorMsg}`);
    return;
  }

  resultCache[mode] = response.result;
  showResult(response.result);
}

// ── Loader ────────────────────────────────────────────────────────────────────
function showLoader(mode) {
  if (!popup) return;
  const loader = popup.querySelector('#accessai-loader');
  const result = popup.querySelector('#accessai-result');
  const loaderText = popup.querySelector('.accessai-loader-text');

  const labels = { simplify: 'Simplifying…', explain: 'Explaining…', summarize: 'Summarizing…' };
  if (loaderText) loaderText.textContent = labels[mode] || 'Processing…';

  if (loader) loader.style.display = 'flex';
  if (result) result.style.display = 'none';
}

function showResult(text) {
  if (!popup) return;
  const loader = popup.querySelector('#accessai-loader');
  const result = popup.querySelector('#accessai-result');

  if (loader) loader.style.display = 'none';
  if (result) {
    result.textContent = text || "No result";
    result.style.display = 'block';
  }
}

// ── Speak ─────────────────────────────────────────────────────────────────────
function handleSpeak() {
  const speakBtn   = popup?.querySelector('#accessai-speak');
  const cachedText = resultCache[activeMode];
  const textToSpeak = cachedText || selectedText;

  if (!textToSpeak) return;

  // Stop if already speaking
  if (speaking) {
    window.speechSynthesis.cancel();
    speaking = false;
    if (speakBtn) speakBtn.textContent = '🔊 Speak';
    return;
  }

  // Auto-detect language from result display
  // If the result starts with "🌐 LangName:", use that language's BCP-47 code
  const resultEl   = popup?.querySelector('#accessai-result');
  const resultText = resultEl?.textContent || '';
  let langCode     = 'en-US';

  if (resultText.startsWith('🌐 ')) {
    const match = resultText.match(/^🌐 ([^:]+):/);
    if (match?.[1]) {
      langCode = LANG_CODE_MAP[match[1].trim()] || 'en-US';
    }
  }

  // Also use active translateLang code when speaking translated content
  if (langCode === 'en-US' && translateLang && translateLang !== 'English') {
    langCode = LANG_CODE_MAP[translateLang] || 'en-US';
  }

  const utterance  = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang   = langCode;
  utterance.rate   = 1.0;
  utterance.onend  = () => { speaking = false; if (speakBtn) speakBtn.textContent = '🔊 Speak'; };
  utterance.onerror = () => { speaking = false; if (speakBtn) speakBtn.textContent = '🔊 Speak'; };

  speaking = true;
  if (speakBtn) speakBtn.textContent = '⏹ Stop';
  window.speechSynthesis.speak(utterance);
}

// ── Language Menu ─────────────────────────────────────────────────────────────
function toggleLangMenu() {
  if (!popup) return;
  const menu   = popup.querySelector('#accessai-lang-menu');
  const search = popup.querySelector('#accessai-lang-search');
  if (!menu) return;

  langMenuOpen = !langMenuOpen;
  menu.style.display = langMenuOpen ? 'block' : 'none';

  if (langMenuOpen) {
    renderLangList('');
    search?.focus();
    search?.addEventListener('input', (e) => renderLangList(e.target.value));
  }
}

function renderLangList(filter) {
  const list = popup?.querySelector('#accessai-lang-list');
  if (!list) return;
  const q = filter.toLowerCase().trim();

  let html = '';
  LANGUAGE_GROUPS.forEach(group => {
    const matches = group.langs.filter(l => !q || l.toLowerCase().includes(q));
    if (!matches.length) return;
    html += `<div class="accessai-lang-group-label">${group.label}</div>`;
    matches.forEach(lang => {
      const active = lang === translateLang ? 'accessai-lang-active' : '';
      html += `<button class="accessai-lang-item ${active}" data-lang="${lang}">${lang}</button>`;
    });
  });

  list.innerHTML = html || '<div class="accessai-lang-none">No languages found</div>';

  list.querySelectorAll('.accessai-lang-item').forEach(btn => {
    btn.addEventListener('click', () => {
      translateLang = btn.dataset.lang;
      langMenuOpen = false;
      const menu = popup?.querySelector('#accessai-lang-menu');
      if (menu) menu.style.display = 'none';
      doTranslate();
    });
  });
}

async function doTranslate() {
  if (!popup || !document.body.contains(popup)) return;
  const textToTranslate = resultCache[activeMode] || selectedText;
  if (!textToTranslate) return;

  showLoader('translate');
  const loaderText = popup?.querySelector('.accessai-loader-text');
  if (loaderText) loaderText.textContent = `Translating to ${translateLang}…`;

  const response = await safeSendMessage({ action: 'translate', text: textToTranslate, targetLanguage: translateLang });

  if (!popup) return;

  if (response?.error) {
    showResult("⚠️ " + response.error);
    return;
  }

  const translated = response?.result || 'Translation unavailable.';
  showResult(`🌐 ${translateLang}:\n\n${translated}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hideAll() {
  window.speechSynthesis?.cancel();
  speaking     = false;
  langMenuOpen = false;
  removeElement(floatBtn);
  removeElement(popup);
  floatBtn = null;
  popup    = null;
}

function removeElement(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

// Clean up if page navigates (SPA support)
window.addEventListener('popstate', hideAll);
