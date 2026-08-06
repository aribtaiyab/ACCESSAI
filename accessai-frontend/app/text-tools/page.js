'use client';

import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { simplifyText, explainText, summarizeText, saveHistory, translateText } from '@/lib/api';

const MODES = [
  { id: 'simplify', label: 'Simplify' },
  { id: 'explain', label: 'Explain' },
  { id: 'summarize', label: 'Summarize' },
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Arabic',
  'Japanese',
  'Hindi',
  'Chinese',
  'Russian',
  'Bengali',
  'Urdu',
];

export default function TextToolsPage() {
  const [mode, setMode] = useState('simplify');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [speechState, setSpeechState] = useState('idle'); // 'idle' | 'speaking' | 'paused'
  const [speechError, setSpeechError] = useState('');
  const speechUtteranceRef = useRef(null);

  const characterCount = useMemo(() => input.length, [input]);
  const displayText = translation || output;

  const handleProcess = async () => {
    if (!input.trim()) {
      setError('Paste a passage to begin.');
      setShowOutput(false);
      setTranslation('');
      setSpeechError('');
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeechState('idle');
    }

    setError('');
    setTranslation('');
    setSpeechError('');
    setLoading(true);
    setShowOutput(false);

    try {
      let data;
      switch (mode) {
        case 'explain':
          data = await explainText(input.trim());
          break;
        case 'summarize':
          data = await summarizeText(input.trim());
          break;
        default:
          data = await simplifyText(input.trim());
      }

      const result = data?.data || data?.result || (typeof data === 'string' ? data : '');
      if (!result) {
        throw new Error('The AI response was empty. Please try again.');
      }

      // Display response immediately and stop loading
      setOutput(result);
      setShowOutput(true);
      setLoading(false);

      // Save history in the background without blocking UI
      saveHistory(mode, input.trim(), result).catch(() => {});
    } catch (err) {
      const message = err.message || 'Processing failed. Please try again.';
      setError(message);
      setOutput('');
      setShowOutput(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = displayText || output;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setTranslation('');
    setError('');
    setShowOutput(false);
    setSpeechError('');
    setSpeechState('idle');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleTranslate = async () => {
    if (!output) return;
    setTranslationLoading(true);
    setSpeechError('');
    try {
      const response = await translateText(output, selectedLanguage);
      if (!response?.success) {
        throw new Error(response?.data || 'Translation failed.');
      }
      setTranslation(response.data || '');
      toast.success(`Translated to ${selectedLanguage}`);
    } catch (err) {
      toast.error(err.message || 'Translation failed.');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleSpeak = () => {
    const textToSpeak = displayText || output;
    if (!textToSpeak) {
      const message = 'Generate an output before speaking it.';
      setSpeechError(message);
      toast.error(message);
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      const message = 'Speech synthesis is not supported in this browser.';
      setSpeechError(message);
      toast.error(message);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Set utterance language hint if available
    const langMap = {
      English: 'en-US',
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
      Italian: 'it-IT',
      Portuguese: 'pt-PT',
      Arabic: 'ar-SA',
      Japanese: 'ja-JP',
      Hindi: 'hi-IN',
      Chinese: 'zh-CN',
      Russian: 'ru-RU',
      Bengali: 'bn-IN',
      Urdu: 'ur-PK',
    };
    if (translation && langMap[selectedLanguage]) {
      utterance.lang = langMap[selectedLanguage];
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => {
      setSpeechState('idle');
    };
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        setSpeechError('Unable to read this response aloud right now.');
      }
      setSpeechState('idle');
    };
    utterance.onpause = () => setSpeechState('paused');
    utterance.onresume = () => setSpeechState('speaking');

    speechUtteranceRef.current = utterance;
    synth.speak(utterance);
    setSpeechError('');
    setSpeechState('speaking');
  };

  const handlePause = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setSpeechState('paused');
    }
  };

  const handleResume = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeechState('speaking');
    }
  };

  const handleStop = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeechState('idle');
  };

  return (
    <main className="bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header banner */}
        <div className="rounded-[2rem] border border-border/80 bg-[linear-gradient(135deg,#FFFDF8_0%,#FAF3E6_100%)] p-8 shadow-[0_25px_70px_-30px_rgba(23,23,23,0.28)] sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Text Tools</p>
              <h1 className="mt-3 text-3xl font-semibold text-textPrimary sm:text-4xl">A calm workspace for clearer thinking.</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-textSecondary">Switch between simplify, explain, and summarize modes in one elegant workspace.</p>
            </div>
            <div className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm text-textSecondary shadow-sm">
              {characterCount} characters
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="rounded-[2rem] border border-border bg-white/90 p-4 shadow-[0_18px_45px_-24px_rgba(23,23,23,0.2)] sm:p-6 lg:p-8">
          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap gap-2 rounded-full border border-border bg-[#FFF8EB] p-1.5">
            {MODES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === tab.id ? 'bg-primary text-black shadow-sm' : 'text-textSecondary hover:bg-white hover:text-textPrimary'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Compact Input Workspace */}
          <div className="mt-6 rounded-[1.5rem] border border-border bg-[#FFFDF8] p-4.5 sm:p-5 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between text-sm text-textSecondary">
              <span className="font-medium text-textPrimary">Input</span>
              <span className="text-xs text-textSecondary">{characterCount} chars</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a paragraph, article, or idea you want to understand better..."
              rows={4}
              className="min-h-[120px] sm:min-h-[130px] max-h-[220px] w-full resize-y rounded-[1.25rem] border border-border bg-white px-4 py-3.5 text-[0.975rem] sm:text-[1rem] leading-relaxed text-textPrimary placeholder:text-textSecondary/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {/* Input Action Controls */}
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <button
                onClick={handleProcess}
                disabled={loading || !input.trim()}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Process'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading || (!input && !output && !error)}
                className="rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Loading Animation (Shown below Input when processing) */}
          {loading && (
            <div className="mt-6 flex items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-[#FFFDF8] p-6 shadow-sm">
              <div className="flex items-center gap-3 rounded-full border border-border bg-[#FFF8EB] px-5 py-3 text-sm font-medium text-textPrimary shadow-sm">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                Generating response...
              </div>
            </div>
          )}

          {/* Error Message (Shown below Input if error occurred) */}
          {error && !loading && (
            <div className="mt-6 rounded-[1.5rem] border border-[#F2C79A] bg-[#FFF7E8] p-4.5 sm:p-5 text-sm text-[#8A4A09] shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Output Section (Initially hidden; rendered below Input after response is received) */}
          {showOutput && !loading && (
            <div className="mt-6 rounded-[1.5rem] border border-border bg-[#FFFDF8] p-5 sm:p-6 shadow-sm transition-all duration-200">
              <div className="mb-3 flex items-center justify-between text-sm text-textSecondary">
                <span className="font-medium text-textPrimary">
                  {translation ? `Output (${selectedLanguage})` : 'Output'}
                </span>
                <span className="rounded-full border border-border bg-white/80 px-2.5 py-0.5 text-xs text-textSecondary">
                  Ready
                </span>
              </div>

              {/* Dynamic Auto-Expanding Output Content Box */}
              <div className="rounded-[1.25rem] border border-border bg-white/95 p-4.5 sm:p-5 text-sm leading-relaxed text-textSecondary shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="whitespace-pre-wrap break-words text-[0.975rem] sm:text-[1rem] leading-relaxed text-textPrimary">
                  {displayText}
                </div>
              </div>

              {/* Horizontally Aligned Output Actions & Translation */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-2">
                {/* Action Buttons: Copy, Speak, Regenerate */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                  >
                    Copy
                  </button>

                  {/* Speech Controls: Speak / Pause / Resume / Stop */}
                  {speechState === 'idle' && (
                    <button
                      onClick={handleSpeak}
                      className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                    >
                      Speak
                    </button>
                  )}
                  {speechState === 'speaking' && (
                    <>
                      <button
                        onClick={handlePause}
                        className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                      >
                        Pause
                      </button>
                      <button
                        onClick={handleStop}
                        className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                      >
                        Stop
                      </button>
                    </>
                  )}
                  {speechState === 'paused' && (
                    <>
                      <button
                        onClick={handleResume}
                        className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                      >
                        Resume
                      </button>
                      <button
                        onClick={handleStop}
                        className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                      >
                        Stop
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleProcess}
                    disabled={loading}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>

                {/* Translation: Language Selector & Translate Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="rounded-full border border-border bg-white px-3 py-2 text-sm text-textPrimary outline-none transition focus:border-primary"
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleTranslate}
                    disabled={translationLoading || !output}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {translationLoading ? 'Translating...' : 'Translate'}
                  </button>
                </div>
              </div>

              {/* Status and Error Notes */}
              {speechState !== 'idle' && (
                <p className="mt-3 text-xs text-textSecondary">
                  Speech synthesis: <span className="font-medium capitalize text-primary">{speechState}</span>
                </p>
              )}
              {speechError && (
                <p className="mt-2 text-xs text-[#8A4A09]">{speechError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
