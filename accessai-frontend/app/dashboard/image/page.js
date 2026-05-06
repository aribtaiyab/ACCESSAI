'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateImageAltText, translateText } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';

// ─── Language map for Web Speech API ────────────────────────────────────────
const LANG_CODE_MAP = {
  English:     'en-US', Hindi:       'hi-IN', Urdu:        'ur-PK',
  Marathi:     'mr-IN', Bengali:     'bn-IN', Tamil:       'ta-IN',
  Telugu:      'te-IN', Kannada:     'kn-IN', Gujarati:    'gu-IN',
  Punjabi:     'pa-IN', Malayalam:   'ml-IN', Odia:        'or-IN',
  Nepali:      'ne-NP', Sinhala:     'si-LK', French:      'fr-FR',
  Spanish:     'es-ES', Portuguese:  'pt-PT', Italian:     'it-IT',
  German:      'de-DE', Dutch:       'nl-NL', Russian:     'ru-RU',
  Polish:      'pl-PL', Ukrainian:   'uk-UA', Greek:       'el-GR',
  Romanian:    'ro-RO', Czech:       'cs-CZ', Swedish:     'sv-SE',
  Norwegian:   'nb-NO', Danish:      'da-DK', Finnish:     'fi-FI',
  Hungarian:   'hu-HU', Arabic:      'ar-SA', Persian:     'fa-IR',
  Turkish:     'tr-TR', Hebrew:      'he-IL', Chinese:     'zh-CN',
  Japanese:    'ja-JP', Korean:      'ko-KR', Indonesian:  'id-ID',
  Malay:       'ms-MY', Thai:        'th-TH', Vietnamese:  'vi-VN',
  Filipino:    'fil-PH', Swahili:     'sw-KE', Amharic:     'am-ET',
  Hausa:       'ha-NG',
};

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
  const { settings }                            = useSettings();

  const visibleText = viewMode === 'translated' && translatedText ? translatedText : result;

  const filteredGroups = langSearch.trim()
    ? LANGUAGE_GROUPS
        .map(g => ({ ...g, langs: g.langs.filter(l => l.toLowerCase().includes(langSearch.toLowerCase())) }))
        .filter(g => g.langs.length > 0)
    : LANGUAGE_GROUPS;

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
    utterance.rate = settings?.speech_rate || 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(visibleText);
    toast.success('Copied to clipboard!');
  };

  const btnStyle = {
    background: '#F5C518', border: 'none', borderRadius: 12, padding: '5px 14px',
    fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.18s',
  };
  const hoverStyle = { background: '#E0B800' };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50 relative">
      {translatedText && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setViewMode('original')}
            style={{ ...btnStyle, background: viewMode === 'original' ? '#F5C518' : '#e5e7eb', color: viewMode === 'original' ? '#000' : '#555' }}
          >Original</button>
          <button
            onClick={() => setViewMode('translated')}
            style={{ ...btnStyle, background: viewMode === 'translated' ? '#F5C518' : '#e5e7eb', color: viewMode === 'translated' ? '#000' : '#555' }}
          >Translated ({activeLang})</button>
        </div>
      )}

      <h3 className="font-semibold mb-2">Alt Text Result:</h3>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{visibleText}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap', position: 'relative' }}>
        <button
          onClick={handleCopy}
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = hoverStyle.background}
          onMouseLeave={e => e.currentTarget.style.background = '#F5C518'}
        >📋 Copy</button>

        <button
          onClick={handleSpeak}
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = hoverStyle.background}
          onMouseLeave={e => e.currentTarget.style.background = '#F5C518'}
        >{speaking ? '⏹ Stop' : '🔊 Speak'}</button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowLangMenu(p => !p); setLangSearch(''); }}
            disabled={translating}
            style={{ ...btnStyle, opacity: translating ? 0.6 : 1 }}
            onMouseEnter={e => e.currentTarget.style.background = hoverStyle.background}
            onMouseLeave={e => e.currentTarget.style.background = '#F5C518'}
          >{translating ? '⏳ Translating…' : '🌍 Translate'}</button>

          {showLangMenu && (
            <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 6px 28px rgba(0,0,0,0.15)', zIndex: 100, width: 220 }}>
              <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid #f0f0f0' }}>
                <input
                  type="text" autoFocus value={langSearch} onChange={e => setLangSearch(e.target.value)} placeholder="🔍 Search language…"
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#F5C518'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {filteredGroups.length === 0 && <p style={{ padding: '14px 16px', color: '#888', fontSize: 13, margin: 0 }}>No languages found</p>}
                {filteredGroups.map(group => (
                  <div key={group.label}>
                    <div style={{ padding: '7px 14px 4px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>{group.label}</div>
                    {group.langs.map(lang => (
                      <button
                        key={lang} onClick={() => { handleTranslate(lang); setLangSearch(''); }}
                        style={{ display: 'block', width: '100%', padding: '8px 16px', textAlign: 'left', border: 'none', background: lang === activeLang ? '#FFF9E6' : 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF9E6'} onMouseLeave={e => e.currentTarget.style.background = lang === activeLang ? '#FFF9E6' : 'transparent'}
                      >{lang}</button>
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
export default function ImagePage() {
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (<5MB) before compression
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      e.target.value = '';
      return;
    }
    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP formats are supported');
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      const compressedBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > 800) {
              height = Math.round((height * 800) / width);
              width = 800;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          };
          img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
      });

      // Check final size (<2MB)
      const base64Size = Math.round((compressedBase64.length * 3) / 4);
      if (base64Size > 2 * 1024 * 1024) {
        toast.error('Image still too large after compression (Max 2MB)');
        e.target.value = '';
        setLoading(false);
        return;
      }

      setFileData(compressedBase64);
      setPreview(compressedBase64);
      setImageUrl('');
      setResult('');
      setShowResult(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    setPreview(e.target.value);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setResult('');
    setShowResult(false);
  };

  const handleProcess = async () => {
    if (!fileData && !imageUrl.trim()) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    const payload = fileData || imageUrl.trim();

    try {
      setLoading(true);
      setShowResult(false);

      const data = await generateImageAltText(payload);
      
      if (!data || !data.reply) {
        throw new Error(data?.message || 'Invalid response from server');
      }

      setResult(data.reply);
      setShowResult(true);
      toast.success('Alt text generated!');
    } catch (error) {
      console.error('API ERROR:', error);
      let errorMsg = error.message;
      if (error.message?.includes('Network')) {
        errorMsg = 'Backend server not reachable. Make sure the backend is running.';
      }
      toast.error(errorMsg || 'Failed to generate alt text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      {loading && <LoadingOverlay />}
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-4">Image Tools</h1>
          <p className="text-textSecondary mt-2">Generate accessible alt text for your images using AI</p>
        </header>

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-gray-50 transition relative">
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                ref={fileInputRef}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-2xl">📸</span>
                <p className="font-medium">Click or drag image to upload</p>
                <p className="text-sm text-textSecondary">JPG, PNG, WebP up to 5MB</p>
              </div>
            </div>

            <div className="flex items-center w-full">
              <hr className="flex-grow border-border" />
              <span className="px-3 text-textSecondary text-sm font-medium">OR</span>
              <hr className="flex-grow border-border" />
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Paste Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Image Preview */}
          {preview && (
            <div className="mt-4 border rounded-lg p-2 bg-gray-50 flex justify-center">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-64 object-contain rounded"
                onError={() => {
                  if (imageUrl) toast.error('Invalid image URL or image not accessible');
                  setPreview(null);
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleProcess}
              disabled={loading}
              className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-hover disabled:opacity-50 transition"
            >
              {loading ? 'Generating...' : 'Generate Alt Text'}
            </button>
            <button
              onClick={() => {
                setImageUrl('');
                setPreview(null);
                setFileData(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setResult('');
                setShowResult(false);
              }}
              disabled={loading}
              className="bg-gray-200 text-textPrimary px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Clear
            </button>
          </div>

          {/* Output Card */}
          {showResult && <OutputCard result={result} />}
        </div>
      </div>
    </main>
  );
}
