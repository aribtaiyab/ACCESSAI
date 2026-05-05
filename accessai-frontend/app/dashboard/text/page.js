/**
 * FILE: accessai-frontend/app/dashboard/text/page.js
 * 1. WHAT: Text tools page with Translate, Speak, and AI loading overlay.
 * 2. WHY: Provides AI text processing (simplify, explain, summarize, alt text)
 *         plus inline Translate and Speak micro-features inside output card.
 * 3. HOW: Uses centralized API utility to process text and save history.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { simplifyText, explainText, summarizeText, generateAltText, translateText } from '@/lib/api';

// ─── Language map for Web Speech API ────────────────────────────────────────
const LANG_CODE_MAP = {
  // South Asian
  English:     'en-US',
  Hindi:       'hi-IN',
  Urdu:        'ur-PK',
  Marathi:     'mr-IN',
  Bengali:     'bn-IN',
  Tamil:       'ta-IN',
  Telugu:      'te-IN',
  Kannada:     'kn-IN',
  Gujarati:    'gu-IN',
  Punjabi:     'pa-IN',
  Malayalam:   'ml-IN',
  Odia:        'or-IN',
  Nepali:      'ne-NP',
  Sinhala:     'si-LK',
  // European
  French:      'fr-FR',
  Spanish:     'es-ES',
  Portuguese:  'pt-PT',
  Italian:     'it-IT',
  German:      'de-DE',
  Dutch:       'nl-NL',
  Russian:     'ru-RU',
  Polish:      'pl-PL',
  Ukrainian:   'uk-UA',
  Greek:       'el-GR',
  Romanian:    'ro-RO',
  Czech:       'cs-CZ',
  Swedish:     'sv-SE',
  Norwegian:   'nb-NO',
  Danish:      'da-DK',
  Finnish:     'fi-FI',
  Hungarian:   'hu-HU',
  // Middle Eastern
  Arabic:      'ar-SA',
  Persian:     'fa-IR',
  Turkish:     'tr-TR',
  Hebrew:      'he-IL',
  // East Asian
  Chinese:     'zh-CN',
  Japanese:    'ja-JP',
  Korean:      'ko-KR',
  // Southeast Asian
  Indonesian:  'id-ID',
  Malay:       'ms-MY',
  Thai:        'th-TH',
  Vietnamese:  'vi-VN',
  Filipino:    'fil-PH',
  // African
  Swahili:     'sw-KE',
  Amharic:     'am-ET',
  Hausa:       'ha-NG',
};

const LANGUAGES = Object.keys(LANG_CODE_MAP);

// Group languages by region for cleaner dropdown display
const LANGUAGE_GROUPS = [
  { label: '🌏 South Asian',    langs: ['English','Hindi','Urdu','Marathi','Bengali','Tamil','Telugu','Kannada','Gujarati','Punjabi','Malayalam','Odia','Nepali','Sinhala'] },
  { label: '🌍 African',        langs: ['Swahili','Amharic','Hausa'] },
  { label: '🌎 European',       langs: ['French','Spanish','Portuguese','Italian','German','Dutch','Russian','Polish','Ukrainian','Greek','Romanian','Czech','Swedish','Norwegian','Danish','Finnish','Hungarian'] },
  { label: '🕌 Middle Eastern', langs: ['Arabic','Persian','Turkish','Hebrew'] },
  { label: '🏯 East Asian',     langs: ['Chinese','Japanese','Korean'] },
  { label: '🌺 Southeast Asian',langs: ['Indonesian','Malay','Thai','Vietnamese','Filipino'] },
];

// ─── LoadingOverlay ──────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0,0,0,0.35)',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.18); opacity: 1; } }
        @keyframes dotBounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-10px); } }
      `}</style>

      {/* Pulsing brain ring */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: '4px solid #F5C518',
        boxShadow: '0 0 24px #F5C51888',
        animation: 'pulse 1.4s ease-in-out infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, marginBottom: 20,
      }}>
        🧠
      </div>

      {/* Thinking dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F5C518',
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>
        AI is thinking…
      </p>
    </div>
  );
}

// ─── OutputCard ──────────────────────────────────────────────────────────────
function OutputCard({ result }) {
  const [translatedText, setTranslatedText]     = useState(null);
  const [viewMode, setViewMode]                 = useState('original');
  const [showLangMenu, setShowLangMenu]         = useState(false);
  const [translating, setTranslating]           = useState(false);
  const [speaking, setSpeaking]                 = useState(false);
  const [activeLang, setActiveLang]             = useState(null);
  const [langSearch, setLangSearch]             = useState('');

  const visibleText = viewMode === 'translated' && translatedText ? translatedText : result;

  // Filter groups by search query
  const filteredGroups = langSearch.trim()
    ? LANGUAGE_GROUPS
        .map(g => ({ ...g, langs: g.langs.filter(l => l.toLowerCase().includes(langSearch.toLowerCase())) }))
        .filter(g => g.langs.length > 0)
    : LANGUAGE_GROUPS;

  // ── Translate ──────────────────────────────────────────────────────────────
  const handleTranslate = async (lang) => {
    setShowLangMenu(false);
    if (lang === activeLang && translatedText) {
      setViewMode('translated');
      return;
    }
    try {
      setTranslating(true);
      const data = await translateText(result, lang);
      if (!data?.success) throw new Error(data?.data || 'Translation failed');
      setTranslatedText(data.data);
      setActiveLang(lang);
      setViewMode('translated');
      toast.success(`Translated to ${lang}`);
    } catch (err) {
      toast.error(err.message || 'Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // ── Speak ──────────────────────────────────────────────────────────────────
  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const langCode = activeLang && viewMode === 'translated'
      ? LANG_CODE_MAP[activeLang] || 'en-US'
      : 'en-US';

    const utterance = new SpeechSynthesisUtterance(visibleText);
    utterance.lang = langCode;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // ── Button style ───────────────────────────────────────────────────────────
  const btnStyle = {
    background: '#F5C518',
    border: 'none',
    borderRadius: 12,
    padding: '5px 14px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.18s',
  };
  const hoverStyle = { background: '#E0B800' };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50" style={{ position: 'relative' }}>

      {/* Toggle: Original / Translated */}
      {translatedText && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setViewMode('original')}
            style={{
              ...btnStyle,
              background: viewMode === 'original' ? '#F5C518' : '#e5e7eb',
              color: viewMode === 'original' ? '#000' : '#555',
            }}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('translated')}
            style={{
              ...btnStyle,
              background: viewMode === 'translated' ? '#F5C518' : '#e5e7eb',
              color: viewMode === 'translated' ? '#000' : '#555',
            }}
          >
            Translated ({activeLang})
          </button>
        </div>
      )}

      {/* Result Text */}
      <h3 className="font-semibold mb-2">Result:</h3>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{visibleText}</p>

      {/* Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap', position: 'relative' }}>

        {/* Speak / Stop */}
        <button
          onClick={handleSpeak}
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = hoverStyle.background}
          onMouseLeave={e => e.currentTarget.style.background = '#F5C518'}
        >
          {speaking ? '⏹ Stop' : '🔊 Speak'}
        </button>

        {/* Translate */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowLangMenu(p => !p);
              setLangSearch('');
            }}
            disabled={translating}
            style={{ ...btnStyle, opacity: translating ? 0.6 : 1 }}
            onMouseEnter={e => e.currentTarget.style.background = hoverStyle.background}
            onMouseLeave={e => e.currentTarget.style.background = '#F5C518'}
          >
            {translating ? '⏳ Translating…' : '🌍 Translate'}
          </button>

          {/* Language Dropdown — grouped by region, scrollable, with search */}
          {showLangMenu && (
            <div style={{
              position: 'absolute', bottom: '110%', left: 0,
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, boxShadow: '0 6px 28px rgba(0,0,0,0.15)',
              zIndex: 100, width: 220,
            }}>
              {/* Search Input */}
              <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid #f0f0f0' }}>
                <input
                  type="text"
                  autoFocus
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  placeholder="🔍 Search language…"
                  style={{
                    width: '100%', padding: '7px 10px',
                    border: '1px solid #e5e7eb', borderRadius: 8,
                    fontSize: 13, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#F5C518'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Language List */}
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {filteredGroups.length === 0 && (
                  <p style={{ padding: '14px 16px', color: '#888', fontSize: 13, margin: 0 }}>
                    No languages found
                  </p>
                )}
                {filteredGroups.map(group => (
                  <div key={group.label}>
                    <div style={{
                      padding: '7px 14px 4px',
                      fontSize: 11, fontWeight: 700, color: '#888',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      borderTop: '1px solid #f0f0f0',
                      background: '#fafafa',
                    }}>
                      {group.label}
                    </div>
                    {group.langs.map(lang => (
                      <button
                        key={lang}
                        onClick={() => { handleTranslate(lang); setLangSearch(''); }}
                        style={{
                          display: 'block', width: '100%', padding: '8px 16px',
                          textAlign: 'left', border: 'none',
                          background: lang === activeLang ? '#FFF9E6' : 'transparent',
                          cursor: 'pointer', fontSize: 14, fontWeight: 500,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF9E6'}
                        onMouseLeave={e => e.currentTarget.style.background = lang === activeLang ? '#FFF9E6' : 'transparent'}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TextPage() {
  const [input, setInput]         = useState('');
  const [result, setResult]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState('simplify');

  const handleProcess = async () => {
    if (!input.trim()) {
      toast.error('Please enter text to process.');
      return;
    }

    try {
      setLoading(true);
      setShowResult(false);

      let data;
      switch (activeTab) {
        case 'simplify':  data = await simplifyText(input);    break;
        case 'explain':   data = await explainText(input);     break;
        case 'summarize': data = await summarizeText(input);   break;
        case 'alttext':   data = await generateAltText(input); break;
        default:          data = await simplifyText(input);
      }

      console.log('API RESPONSE:', data);

      if (!data || !data.reply) {
        throw new Error(data?.message || 'Invalid response from server');
      }

      setResult(data.reply);
      setShowResult(true);
      toast.success('Processing complete!');
    } catch (error) {
      console.error('API ERROR:', error);
      let errorMsg = error.message;
      if (error.message?.includes('Network')) {
        errorMsg = 'Backend server not reachable. Make sure the backend is running on port 5000.';
      }
      toast.error(errorMsg || 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      {/* AI Thinking Loading Overlay */}
      {loading && <LoadingOverlay />}

      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-4">Text Tools</h1>
          <p className="text-textSecondary mt-2">Simplify, explain, and process your text with AI</p>
        </header>

        <div className="space-y-6">
          {/* Tab Selection */}
          <div className="flex gap-2 border-b border-border">
            {[
              { id: 'simplify',  label: 'Simplify'  },
              { id: 'explain',   label: 'Explain'   },
              { id: 'summarize', label: 'Summarize' },
              { id: 'alttext',   label: 'Alt Text'  },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Text to Process</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your text here..."
              className="w-full h-32 p-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleProcess}
              disabled={loading}
              className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-hover disabled:opacity-50 transition"
            >
              {loading ? 'Processing...' : 'Process Text'}
            </button>
            <button
              onClick={() => {
                setInput('');
                setResult('');
                setShowResult(false);
              }}
              disabled={loading}
              className="bg-gray-200 text-textPrimary px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Clear
            </button>
          </div>

          {/* Output Card with Translate + Speak */}
          {showResult && <OutputCard result={result} />}
        </div>
      </div>
    </main>
  );
}
