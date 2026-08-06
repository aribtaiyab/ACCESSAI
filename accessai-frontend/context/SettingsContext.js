'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import toast from 'react-hot-toast';

const defaultSettings = {
  font_size:      16,
  speech_rate:    1.0,
  dyslexia_mode:  false,
  high_contrast:  false,
  dark_mode:      false,
};

const SettingsContext = createContext({
  settings:      defaultSettings,
  updateSetting: () => {},
  isSaving:      false,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const [settings,  setSettings]  = useState(defaultSettings);
  const [isSaving,  setIsSaving]  = useState(false);
  const [isLoaded,  setIsLoaded]  = useState(false);
  const saveTimeoutRef = useRef(null);

  // Load initial settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.data) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      } catch {
        // Silently fall back to defaults if not authenticated or server unavailable
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Apply settings to the document root
  useEffect(() => {
    if (!isLoaded || typeof document === 'undefined') return;

    const root = document.documentElement;

    // Font Size
    root.style.fontSize = `${settings.font_size}px`;

    // Dyslexia Mode
    root.classList.toggle('dyslexia-mode',      Boolean(settings.dyslexia_mode));
    root.classList.toggle('high-contrast-mode', Boolean(settings.high_contrast));
    root.classList.toggle('dark',               Boolean(settings.dark_mode));
  }, [settings, isLoaded]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateSettings(newSettings);
        } catch {
          toast.error('Failed to save settings automatically');
        } finally {
          setIsSaving(false);
        }
      }, 500);

      return newSettings;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, isSaving }}>
      {children}

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50 animate-pulse">
          Saving...
        </div>
      )}

      {/* FIX (Bug #11): Replaced <style jsx global> (styled-jsx, not available in App Router)
          with a standard <style> tag. The global modifier is not needed here since
          these classes are applied to document.documentElement directly. */}
      <style>{`
        .dyslexia-mode * {
          font-family: 'Comic Sans MS', 'OpenDyslexic', sans-serif !important;
          letter-spacing: 0.05em;
          word-spacing: 0.1em;
          line-height: 1.8 !important;
        }

        .high-contrast-mode {
          filter: contrast(150%) saturate(120%) brightness(95%);
        }
      `}</style>
    </SettingsContext.Provider>
  );
}
