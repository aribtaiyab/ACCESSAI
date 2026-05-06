'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-border pb-6">
          <Link href="/dashboard" className="text-primary font-medium hover:underline flex items-center gap-2">
            <span>←</span> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-6">Accessibility Settings</h1>
          <p className="text-textSecondary mt-2">Personalize your experience. Changes are saved automatically.</p>
        </header>

        <div className="space-y-8 bg-white p-8 rounded-xl border border-border shadow-sm">
          
          {/* Typography Settings */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">Aa</span> Typography
            </h2>
            
            <div className="space-y-6">
              {/* Font Size */}
              <div className="bg-gray-50 p-5 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-4">
                  <label htmlFor="fontSize" className="font-semibold">Global Font Size</label>
                  <span className="bg-white px-3 py-1 rounded border border-border font-mono text-sm font-bold">
                    {settings.font_size}px
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs">12px</span>
                  <input 
                    type="range" 
                    id="fontSize"
                    min="12" 
                    max="24" 
                    step="1"
                    value={settings.font_size} 
                    onChange={(e) => updateSetting('font_size', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xl">24px</span>
                </div>
              </div>

              {/* Dyslexia Mode Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-5 rounded-lg border border-border">
                <div>
                  <label className="font-semibold block mb-1">Dyslexia-Friendly Mode</label>
                  <p className="text-sm text-textSecondary">Use an easier-to-read font with wider letter spacing.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.dyslexia_mode}
                    onChange={(e) => updateSetting('dyslexia_mode', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Visual Settings */}
          <section>
            <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2">
              <span className="text-primary">👁</span> Visual Display
            </h2>
            
            <div className="space-y-6">
              {/* High Contrast Mode Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-5 rounded-lg border border-border">
                <div>
                  <label className="font-semibold block mb-1">High Contrast Mode</label>
                  <p className="text-sm text-textSecondary">Increase contrast and saturation across the entire application.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.high_contrast}
                    onChange={(e) => updateSetting('high_contrast', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-5 rounded-lg border border-border">
                <div>
                  <label className="font-semibold block mb-1">Dark Mode</label>
                  <p className="text-sm text-textSecondary">Switch to a darker theme to reduce eye strain in low-light environments.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.dark_mode}
                    onChange={(e) => updateSetting('dark_mode', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Audio Settings */}
          <section>
            <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2">
              <span className="text-primary">🔊</span> Text-to-Speech
            </h2>
            
            <div className="space-y-6">
              {/* Speech Rate */}
              <div className="bg-gray-50 p-5 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-4">
                  <label htmlFor="speechRate" className="font-semibold">Speech Rate</label>
                  <span className="bg-white px-3 py-1 rounded border border-border font-mono text-sm font-bold">
                    {settings.speech_rate}x
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">0.5x</span>
                  <input 
                    type="range" 
                    id="speechRate"
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={settings.speech_rate} 
                    onChange={(e) => updateSetting('speech_rate', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm">2.0x</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
