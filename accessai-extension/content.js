/**
 * content.js — AccessAI Extension Content Script (Production Edition)
 *
 * Runs inside the user's webpage in an isolated execution world.
 * Detects text selection → displays floating trigger → renders premium assistant popup.
 * Features:
 *   - AI Simplify, Explain, Summarize, and 90+ Language Translation
 *   - Voice Page Assistant ("Ask This Page") with Web Speech API & TTS
 *   - Synced user preferences via chrome.storage.sync
 *   - Zero host-page interference and strict XSS protection
 */

(() => {
  'use strict';

  // ── Configuration Fallback ──────────────────────────────────────────────────
  const cfg = (typeof window !== 'undefined' && window.AccessAIConfig) ? window.AccessAIConfig : {
    DEFAULT_LANG: 'Hindi',
    STORAGE_KEYS: { TRANSLATE_LANG: 'accessai_translate_lang' },
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let selectedText        = '';
  let floatBtn            = null;
  let popup               = null;
  let activeMode          = 'simplify';
  let resultCache         = { simplify: '', explain: '', summarize: '' };
  let speaking            = false;
  let translateLang       = cfg.DEFAULT_LANG || 'Hindi';
  let langMenuOpen        = false;
  let warmupTimer         = null;

  // Voice assistant state
  let voiceRecognition    = null;
  let voiceSpeaking       = false;
  let voiceResponseCache  = '';

  // Load saved target language from synced storage
  if (chrome.storage?.sync) {
    chrome.storage.sync.get([cfg.STORAGE_KEYS?.TRANSLATE_LANG || 'accessai_translate_lang'], (res) => {
      if (res && res[cfg.STORAGE_KEYS?.TRANSLATE_LANG || 'accessai_translate_lang']) {
        translateLang = res[cfg.STORAGE_KEYS?.TRANSLATE_LANG || 'accessai_translate_lang'];
      }
    });
  }

  // ── Full Language List (Grouped) ───────────────────────────────────────────
  const LANGUAGE_GROUPS = [
    { label: '🌏 South Asian', langs: ['Hindi','Urdu','Bengali','Tamil','Telugu','Kannada','Gujarati','Punjabi','Malayalam','Odia','Marathi','Nepali','Sinhala','Assamese','Maithili'] },
    { label: '🌍 African',     langs: ['Swahili','Amharic','Hausa','Yoruba','Igbo','Zulu','Xhosa','Shona','Somali','Afrikaans'] },
    { label: '🌎 European',    langs: ['French','Spanish','Portuguese','Italian','German','Dutch','Russian','Polish','Ukrainian','Greek','Romanian','Czech','Slovak','Swedish','Norwegian','Danish','Finnish','Hungarian','Bulgarian','Croatian','Serbian','Slovenian','Lithuanian','Latvian','Estonian','Albanian','Macedonian','Bosnian'] },
    { label: '🕌 Middle Eastern', langs: ['Arabic','Persian','Turkish','Hebrew','Kurdish','Pashto','Azerbaijani','Georgian','Armenian'] },
    { label: '🏯 East Asian',  langs: ['Chinese','Japanese','Korean','Mongolian','Tibetan'] },
    { label: '🌺 Southeast Asian', langs: ['Indonesian','Malay','Thai','Vietnamese','Filipino','Burmese','Khmer','Lao','Javanese'] },
    { label: '🌐 Other',       langs: ['English','Latin','Esperanto','Welsh','Irish','Basque','Catalan','Galician','Maltese'] },
  ];

  // ── BCP-47 Language Codes for Speech Synthesis & Recognition ────────────────
  const LANG_CODE_MAP = {
    Hindi: 'hi-IN', Urdu: 'ur-PK', Bengali: 'bn-IN', Tamil: 'ta-IN',
    Telugu: 'te-IN', Kannada: 'kn-IN', Gujarati: 'gu-IN', Punjabi: 'pa-IN',
    Malayalam: 'ml-IN', Odia: 'or-IN', Marathi: 'mr-IN', Nepali: 'ne-NP',
    Sinhala: 'si-LK', Assamese: 'as-IN', Maithili: 'mai-IN',
    Swahili: 'sw-KE', Amharic: 'am-ET', Hausa: 'ha-NG', Yoruba: 'yo-NG',
    Igbo: 'ig-NG', Zulu: 'zu-ZA', Xhosa: 'xh-ZA', Shona: 'sn-ZW',
    Somali: 'so-SO', Afrikaans: 'af-ZA',
    French: 'fr-FR', Spanish: 'es-ES', Portuguese: 'pt-PT', Italian: 'it-IT',
    German: 'de-DE', Dutch: 'nl-NL', Russian: 'ru-RU', Polish: 'pl-PL',
    Ukrainian: 'uk-UA', Greek: 'el-GR', Romanian: 'ro-RO', Czech: 'cs-CZ',
    Slovak: 'sk-SK', Swedish: 'sv-SE', Norwegian: 'nb-NO', Danish: 'da-DK',
    Finnish: 'fi-FI', Hungarian: 'hu-HU', Bulgarian: 'bg-BG', Croatian: 'hr-HR',
    Serbian: 'sr-RS', Slovenian: 'sl-SI', Lithuanian: 'lt-LT', Latvian: 'lv-LV',
    Estonian: 'et-EE', Albanian: 'sq-AL', Macedonian: 'mk-MK', Bosnian: 'bs-BA',
    Arabic: 'ar-SA', Persian: 'fa-IR', Turkish: 'tr-TR', Hebrew: 'he-IL',
    Kurdish: 'ku-TR', Pashto: 'ps-AF', Azerbaijani: 'az-AZ',
    Georgian: 'ka-GE', Armenian: 'hy-AM',
    Chinese: 'zh-CN', Japanese: 'ja-JP', Korean: 'ko-KR',
    Mongolian: 'mn-MN', Tibetan: 'bo-CN',
    Indonesian: 'id-ID', Malay: 'ms-MY', Thai: 'th-TH', Vietnamese: 'vi-VN',
    Filipino: 'fil-PH', Burmese: 'my-MM', Khmer: 'km-KH',
    Lao: 'lo-LA', Javanese: 'jv-ID',
    English: 'en-US', Latin: 'la', Esperanto: 'eo', Welsh: 'cy-GB',
    Irish: 'ga-IE', Basque: 'eu-ES', Catalan: 'ca-ES',
    Galician: 'gl-ES', Maltese: 'mt-MT',
  };

  // ── Resilient Message Passing Helper ────────────────────────────────────────
  function safeSendMessage(payload) {
    return new Promise((resolve) => {
      if (!chrome.runtime?.id) {
        resolve({ error: 'Extension updated. Please refresh the page.' });
        return;
      }
      try {
        chrome.runtime.sendMessage(payload, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message || 'Connection lost. Please retry.' });
          } else {
            resolve(response || { error: 'No response received.' });
          }
        });
      } catch (err) {
        resolve({ error: err?.message || 'Failed to communicate with extension.' });
      }
    });
  }

  // ── Text Selection Listener ─────────────────────────────────────────────────
  document.addEventListener('mouseup', (e) => {
    if (e.target?.closest?.('#accessai-btn') || e.target?.closest?.('#accessai-popup')) {
      return;
    }

    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 2) {
      if (selectedText !== text) {
        selectedText = text;
        resultCache = { simplify: '', explain: '', summarize: '' };

        // Speculative pre-fetch for instant response on Simplify tab
        safeSendMessage({ action: 'simplify', text: selectedText }).then((response) => {
          if (!response?.error && response?.result) {
            resultCache['simplify'] = response.result;
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
    } catch {
      // Safe boundary
    }
  });

  // ── Floating Button ─────────────────────────────────────────────────────────
  function showFloatButton(x, y) {
    removeElement(floatBtn);

    floatBtn = document.createElement('div');
    floatBtn.id = 'accessai-btn';
    floatBtn.textContent = 'AccessAI';
    floatBtn.title = 'Click to open AccessAI assistant';
    floatBtn.setAttribute('role', 'button');
    floatBtn.setAttribute('aria-label', 'Open AccessAI assistant');

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    floatBtn.style.left = `${Math.min(x + scrollX, window.innerWidth + scrollX - 160)}px`;
    floatBtn.style.top  = `${y + scrollY + 14}px`;

    floatBtn.addEventListener('click', () => {
      activeMode = 'simplify';
      showPopup(x, y);
      if (resultCache['simplify']) {
        showResult(resultCache['simplify']);
      } else {
        fetchResult('simplify');
      }
    });

    document.body.appendChild(floatBtn);
  }

  // ── Assistant Popup ─────────────────────────────────────────────────────────
  function showPopup(x, y) {
    removeElement(popup);
    if (warmupTimer) clearTimeout(warmupTimer);
    speaking           = false;
    voiceSpeaking      = false;
    voiceResponseCache = '';

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    popup = document.createElement('div');
    popup.id = 'accessai-popup';

    const popupW = 368;
    const left = Math.max(12, Math.min(x + scrollX, window.innerWidth + scrollX - popupW - 16));

    popup.style.left = `${left}px`;
    popup.style.top  = `${y + scrollY + 46}px`;

    popup.innerHTML = buildPopupHTML();
    document.body.appendChild(popup);

    // Warm-up / slow network helper
    warmupTimer = setTimeout(() => {
      if (!popup || !document.body.contains(popup)) return;
      const loader = popup.querySelector('#accessai-loader');
      const loaderText = popup.querySelector('.accessai-loader-text');
      if (loader && loader.style.display !== 'none' && loaderText) {
        loaderText.textContent = 'Connecting to AI service…';
      }
    }, 4500);

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

    // Translate button
    popup.querySelector('#accessai-translate')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLangMenu();
    });

    // Close button
    popup.querySelector('#accessai-close')?.addEventListener('click', hideAll);

    // Voice assistant wiring
    popup.querySelector('#accessai-mic-btn')?.addEventListener('click', handleVoiceMic);
    popup.querySelector('#accessai-ask-btn')?.addEventListener('click', handleVoiceAsk);

    const voiceInput = popup.querySelector('#accessai-voice-input');
    if (voiceInput) {
      voiceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleVoiceAsk();
        }
      });
    }

    // Remove float button once popup is open
    removeElement(floatBtn);
    floatBtn = null;
  }

  function buildPopupHTML() {
    return `
      <!-- ── Header: Brand + Tabs + Close ── -->
      <div class="accessai-header">
        <div class="accessai-brand" aria-label="AccessAI">
          <div class="accessai-logo" aria-hidden="true"></div>
          <span class="accessai-logo-text">AccessAI</span>
        </div>
        <div class="accessai-tabs" role="tablist" aria-label="AI tools">
          <button class="accessai-tab active" role="tab" aria-selected="true"  data-mode="simplify">Simplify</button>
          <button class="accessai-tab"        role="tab" aria-selected="false" data-mode="explain">Explain</button>
          <button class="accessai-tab"        role="tab" aria-selected="false" data-mode="summarize">Summary</button>
        </div>
        <button id="accessai-close" title="Close" aria-label="Close">✕</button>
      </div>

      <!-- ── Body: Loader + Result ── -->
      <div class="accessai-body" role="region" aria-live="polite">
        <div id="accessai-loader" class="accessai-loader" aria-label="Loading">
          <span class="accessai-spinner" aria-hidden="true"></span>
          <span class="accessai-loader-text">Simplifying…</span>
        </div>
        <div id="accessai-result" class="accessai-result" style="display:none;"></div>
      </div>

      <!-- ── Footer: Actions ── -->
      <div class="accessai-footer">
        <button id="accessai-speak" title="Speak result" aria-label="Speak result">🔊 Speak</button>
        <div class="accessai-translate-wrap">
          <button id="accessai-translate" title="Translate result" aria-haspopup="listbox">🌐 Translate ▾</button>
          <div id="accessai-lang-menu" class="accessai-lang-menu" style="display:none;" role="listbox" aria-label="Select language">
            <div class="accessai-lang-search-wrap">
              <input id="accessai-lang-search" class="accessai-lang-search" type="search" placeholder="Search language…" aria-label="Search languages" autocomplete="off" />
            </div>
            <div id="accessai-lang-list" class="accessai-lang-list"></div>
          </div>
        </div>
      </div>

      <!-- ── Voice Assistant: Ask This Page ── -->
      <div class="accessai-voice-divider" aria-hidden="true">
        <span class="accessai-voice-divider-label">🎙 Ask This Page</span>
      </div>

      <div class="accessai-voice-section">
        <div class="accessai-voice-input-row" role="search">
          <button
            id="accessai-mic-btn"
            class="accessai-mic-btn"
            title="Hold to speak your question"
            aria-label="Start voice input"
            type="button"
          >🎤</button>
          <input
            id="accessai-voice-input"
            class="accessai-voice-input"
            type="text"
            placeholder="Ask anything about this page…"
            autocomplete="off"
            aria-label="Ask a question about this page"
            spellcheck="false"
          />
          <button
            id="accessai-ask-btn"
            class="accessai-ask-btn"
            type="button"
            aria-label="Submit question"
          >Ask</button>
        </div>
        <div id="accessai-voice-result-wrap" style="display:none;" aria-live="polite"></div>
      </div>
    `;
  }

  // ── Tab State Management ────────────────────────────────────────────────────
  function updateActiveTabs() {
    if (!popup) return;
    popup.querySelectorAll('.accessai-tab').forEach(btn => {
      const isActive = btn.dataset.mode === activeMode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    const loaderText = popup.querySelector('.accessai-loader-text');
    if (loaderText) {
      const labels = { simplify: 'Simplifying…', explain: 'Explaining…', summarize: 'Summarizing…' };
      loaderText.textContent = labels[activeMode] || 'Processing…';
    }
  }

  // ── Fetch AI Tool Result ────────────────────────────────────────────────────
  async function fetchResult(mode) {
    showLoader(mode);

    let response = await safeSendMessage({ action: mode, text: selectedText });

    // One automatic retry if connection blipped
    if (response?.error && response.error.includes('Connection')) {
      response = await safeSendMessage({ action: mode, text: selectedText });
    }

    if (!response || response.error) {
      showResult(`⚠️ ${response?.error || 'Connection unavailable. Please click again.'}`);
      return;
    }

    resultCache[mode] = response.result;
    showResult(response.result);
  }

  // ── Loader & Result Display ─────────────────────────────────────────────────
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
    if (warmupTimer) { clearTimeout(warmupTimer); warmupTimer = null; }
    const loader = popup.querySelector('#accessai-loader');
    const result = popup.querySelector('#accessai-result');
    if (loader) loader.style.display = 'none';
    if (result) {
      result.textContent = text || 'No result returned.';
      result.style.display = 'block';
    }
  }

  // ── Voice Quality Matching Helper ───────────────────────────────────────────
  function getBestVoice(langCode) {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    let filtered = voices.filter(v => v.lang.replace('_','-') === langCode.replace('_','-'));
    if (!filtered.length) {
      const base = langCode.split('-')[0];
      filtered = voices.filter(v => v.lang.startsWith(base));
    }
    const qualityKeywords = ['Google', 'Natural', 'Premium', 'Microsoft', 'Enhanced'];
    filtered.sort((a, b) => {
      const score = (v) => qualityKeywords.reduce((acc, q, i) => acc + (v.name.includes(q) ? (10 - i) : 0), 0);
      return score(b) - score(a);
    });
    return filtered[0] || null;
  }

  // ── Text-to-Speech (TTS) ────────────────────────────────────────────────────
  function handleSpeak() {
    const speakBtn    = popup?.querySelector('#accessai-speak');
    const cachedText  = resultCache[activeMode];
    const textToSpeak = cachedText || selectedText;
    if (!textToSpeak || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      speaking = false;
      if (speakBtn) speakBtn.textContent = '🔊 Speak';
      return;
    }

    const resultEl   = popup?.querySelector('#accessai-result');
    const resultText = resultEl?.textContent || '';
    let langCode = 'en-US';

    if (resultText.startsWith('🌐 ')) {
      const match = resultText.match(/^🌐 ([^:]+):/);
      if (match?.[1]) langCode = LANG_CODE_MAP[match[1].trim()] || 'en-US';
    }
    if (langCode === 'en-US' && translateLang && translateLang !== 'English') {
      langCode = LANG_CODE_MAP[translateLang] || 'en-US';
    }

    const utterance  = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang   = langCode;
    utterance.voice  = getBestVoice(langCode);
    utterance.rate   = 0.92;
    utterance.pitch  = 0.95;
    utterance.volume = 1.0;

    utterance.onend  = () => { speaking = false; if (speakBtn) speakBtn.textContent = '🔊 Speak'; };
    utterance.onerror = () => { speaking = false; if (speakBtn) speakBtn.textContent = '🔊 Speak'; };

    speaking = true;
    if (speakBtn) speakBtn.textContent = '⏹ Stop';
    window.speechSynthesis.speak(utterance);
  }

  // ── Translation Language Picker ─────────────────────────────────────────────
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
    const q = (filter || '').toLowerCase().trim();

    let html = '';
    LANGUAGE_GROUPS.forEach(group => {
      const matches = group.langs.filter(l => !q || l.toLowerCase().includes(q));
      if (!matches.length) return;
      html += `<div class="accessai-lang-group-label">${escapeHTML(group.label)}</div>`;
      matches.forEach(lang => {
        const active = lang === translateLang ? 'accessai-lang-active' : '';
        html += `<button class="accessai-lang-item ${active}" data-lang="${escapeHTML(lang)}">${escapeHTML(lang)}</button>`;
      });
    });

    list.innerHTML = html || '<div class="accessai-lang-none">No languages found</div>';

    list.querySelectorAll('.accessai-lang-item').forEach(btn => {
      btn.addEventListener('click', () => {
        translateLang = btn.dataset.lang;
        // Persist language choice in synced storage
        if (chrome.storage?.sync) {
          chrome.storage.sync.set({ [cfg.STORAGE_KEYS?.TRANSLATE_LANG || 'accessai_translate_lang']: translateLang });
        }
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

    const response = await safeSendMessage({
      action: 'translate',
      text: textToTranslate,
      targetLanguage: translateLang,
    });

    if (!popup) return;

    if (response?.error) {
      showResult('⚠️ ' + response.error);
      return;
    }

    const translated = response?.result || 'Translation unavailable.';
    showResult(`🌐 ${translateLang}:\n\n${translated}`);
  }

  // ── Voice Page Assistant ("Ask This Page") ──────────────────────────────────
  function getPageContext() {
    try {
      const priority = ['main', 'article', '[role="main"]', '.content', '#content', 'body'];
      let text = '';
      for (const sel of priority) {
        const el = document.querySelector(sel);
        if (el) {
          text = el.innerText || el.textContent || '';
          if (text.trim().length > 100) break;
        }
      }
      text = text.replace(/\s+/g, ' ').trim();
      return text.slice(0, 4000);
    } catch {
      return document.body?.innerText?.slice(0, 4000) || '';
    }
  }

  function handleVoiceMic() {
    const micBtn     = popup?.querySelector('#accessai-mic-btn');
    const voiceInput = popup?.querySelector('#accessai-voice-input');
    if (!micBtn || !voiceInput) return;

    if (voiceRecognition) {
      voiceRecognition.stop();
      voiceRecognition = null;
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎤';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceInput.value = '';
      voiceInput.placeholder = 'Voice input not supported in this browser — type question';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micBtn.classList.add('recording');
    micBtn.textContent = '⏹';
    voiceInput.placeholder = 'Listening…';

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      voiceInput.value = transcript;
      voiceInput.placeholder = 'Ask anything about this page…';
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎤';
      voiceRecognition = null;
      if (transcript.trim()) handleVoiceAsk();
    };

    recognition.onerror = () => {
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎤';
      voiceInput.placeholder = 'Ask anything about this page…';
      voiceRecognition = null;
    };

    recognition.onend = () => {
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎤';
      voiceRecognition = null;
    };

    voiceRecognition = recognition;
    recognition.start();
  }

  async function handleVoiceAsk() {
    if (!popup) return;
    const voiceInput   = popup.querySelector('#accessai-voice-input');
    const resultWrap   = popup.querySelector('#accessai-voice-result-wrap');
    const askBtn       = popup.querySelector('#accessai-ask-btn');
    const question     = voiceInput?.value?.trim();

    if (!question) return;

    if (resultWrap) {
      resultWrap.style.display = 'block';
      resultWrap.innerHTML = `
        <div class="accessai-voice-loader">
          <span class="accessai-spinner"></span>
          <span>Thinking…</span>
        </div>`;
    }
    if (askBtn) askBtn.disabled = true;

    const pageContext = getPageContext();
    const pageTitle   = document.title || '';
    const pageUrl     = window.location.href;

    const response = await safeSendMessage({
      action: 'askPage',
      question,
      pageContext,
      pageTitle,
      pageUrl,
    });

    if (!popup || !document.body.contains(popup)) return;
    if (askBtn) askBtn.disabled = false;

    if (response?.error) {
      if (resultWrap) {
        resultWrap.style.display = 'block';
        resultWrap.innerHTML = renderVoiceCard(`⚠️ ${response.error}`, false);
      }
      return;
    }

    const answer = response?.result || 'No answer received.';
    voiceResponseCache = answer;

    if (resultWrap) {
      resultWrap.style.display = 'block';
      resultWrap.innerHTML = renderVoiceCard(answer, true);
      resultWrap.querySelector('#accessai-voice-speak')?.addEventListener('click', handleVoiceSpeak);
    }
  }

  function renderVoiceCard(text, showSpeakBtn) {
    const speakHtml = showSpeakBtn
      ? `<div class="accessai-voice-response-footer">
           <button id="accessai-voice-speak" class="accessai-voice-speak-btn" type="button" aria-label="Speak response">
             🔊 Speak
           </button>
         </div>`
      : '';
    return `
      <div class="accessai-voice-response" role="article" aria-label="AI response">
        <div class="accessai-voice-response-text">${escapeHTML(text)}</div>
        ${speakHtml}
      </div>`;
  }

  function handleVoiceSpeak() {
    const speakBtn = popup?.querySelector('#accessai-voice-speak');
    if (!voiceResponseCache || !window.speechSynthesis) return;

    if (voiceSpeaking) {
      window.speechSynthesis.cancel();
      voiceSpeaking = false;
      if (speakBtn) speakBtn.textContent = '🔊 Speak';
      return;
    }

    let langCode = 'en-US';
    for (const lang of Object.keys(LANG_CODE_MAP)) {
      if (voiceResponseCache.includes(lang)) {
        langCode = LANG_CODE_MAP[lang];
        break;
      }
    }

    const utterance = new SpeechSynthesisUtterance(voiceResponseCache);
    utterance.lang  = langCode;
    utterance.voice = getBestVoice(langCode);
    utterance.rate  = 0.90;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      voiceSpeaking = false;
      if (speakBtn) speakBtn.textContent = '🔊 Speak';
    };
    utterance.onerror = () => {
      voiceSpeaking = false;
      if (speakBtn) speakBtn.textContent = '🔊 Speak';
    };

    voiceSpeaking = true;
    if (speakBtn) speakBtn.textContent = '⏹ Stop';
    window.speechSynthesis.speak(utterance);
  }

  // ── XSS Sanitization Helper ─────────────────────────────────────────────────
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Teardown & Navigation Cleanup ───────────────────────────────────────────
  function hideAll() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (warmupTimer) { clearTimeout(warmupTimer); warmupTimer = null; }
    speaking      = false;
    voiceSpeaking = false;
    langMenuOpen  = false;
    if (voiceRecognition) {
      try { voiceRecognition.stop(); } catch { /* noop */ }
      voiceRecognition = null;
    }
    removeElement(floatBtn);
    removeElement(popup);
    floatBtn = null;
    popup    = null;
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Teardown listeners for SPA navigation and page unload
  window.addEventListener('popstate', hideAll);
  window.addEventListener('beforeunload', hideAll);
})();
