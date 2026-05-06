'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import toast from 'react-hot-toast';

const defaultSettings = {
  font_size: 16,
  speech_rate: 1.0,
  dyslexia_mode: false,
  high_contrast: false,
  dark_mode: false,
};

const SettingsContext = createContext({
  settings: defaultSettings,
  updateSetting: () => {},
  isSaving: false,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.data) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Apply settings globally to the document
  useEffect(() => {
    if (!isLoaded) return;
    
    const root = document.documentElement;
    
    // Font Size
    root.style.fontSize = `${settings.font_size}px`;
    
    // Dyslexia Mode
    if (settings.dyslexia_mode) {
      root.classList.add('dyslexia-mode');
    } else {
      root.classList.remove('dyslexia-mode');
    }
    
    // High Contrast Mode
    if (settings.high_contrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
    
    // Dark Mode
    if (settings.dark_mode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

  }, [settings, isLoaded]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      // Debounced API call
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateSettings(newSettings);
        } catch (error) {
          console.error('Failed to save settings:', error);
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

      <style jsx global>{`
        .dyslexia-mode {
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
