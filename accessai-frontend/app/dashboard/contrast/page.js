'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

// ─── Helper Functions for WCAG Contrast ──────────────────────────────────────
const hexToRgb = (hex) => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const int = parseInt(cleanHex, 16);
  if (isNaN(int)) return null;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const getLuminance = ({ r, g, b }) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const calculateContrastRatio = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return null;
  
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

const isValidHex = (hex) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

export default function ContrastPage() {
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = () => {
    if (!isValidHex(fgColor) || !isValidHex(bgColor)) {
      toast.error('Invalid color format. Please use hex colors (e.g. #FFFFFF).');
      return;
    }

    if (fgColor.toLowerCase() === bgColor.toLowerCase()) {
      toast.error('Warning: Foreground and background colors are identical!');
    }

    setLoading(true);
    setResult(null);

    try {
      const ratio = calculateContrastRatio(fgColor, bgColor);
      if (ratio) {
        setResult({
          ratio: ratio.toFixed(2),
          aaLarge: ratio >= 3.0,
          aaNormal: ratio >= 4.5,
          aaaLarge: ratio >= 4.5,
          aaaNormal: ratio >= 7.0,
          suggestion: ratio < 4.5 
            ? getLuminance(hexToRgb(bgColor)) > 0.5 ? '#000000' : '#FFFFFF' 
            : null
        });
      }
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
          <h1 className="text-3xl font-bold mt-4">Contrast Checker</h1>
          <p className="text-textSecondary mt-2">Ensure your colors meet WCAG accessibility standards</p>
        </header>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Foreground Color Picker */}
            <div className="p-4 border border-border rounded-lg bg-gray-50 flex flex-col gap-3">
              <label className="block text-sm font-semibold">Foreground Color (Text)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={fgColor} 
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <input 
                  type="text" 
                  value={fgColor} 
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary uppercase font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="p-4 border border-border rounded-lg bg-gray-50 flex flex-col gap-3">
              <label className="block text-sm font-semibold">Background Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <input 
                  type="text" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary uppercase font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCheck}
              disabled={loading}
              className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-hover disabled:opacity-50 transition"
            >
              {loading ? 'Checking...' : 'Check Contrast'}
            </button>
            <button
              onClick={() => {
                setFgColor('#000000');
                setBgColor('#FFFFFF');
                setResult(null);
              }}
              disabled={loading}
              className="bg-gray-200 text-textPrimary px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Reset
            </button>
          </div>

          {/* Result Area */}
          {result && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Results</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Live Preview */}
                <div 
                  className="border border-border rounded-lg p-8 flex items-center justify-center min-h-[160px] shadow-sm transition-colors duration-300"
                  style={{ backgroundColor: bgColor, color: fgColor }}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold mb-2">Live Preview</p>
                    <p className="text-lg">Can you read this comfortably?</p>
                  </div>
                </div>

                {/* Score Card */}
                <div className="border border-border rounded-lg p-6 bg-gray-50 flex flex-col justify-center">
                  <p className="text-sm text-textSecondary uppercase font-bold tracking-wider mb-1">Contrast Ratio</p>
                  <p className="text-5xl font-black">{result.ratio}:1</p>
                  
                  {result.suggestion && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                      <strong>Suggestion:</strong> Contrast is too low. Try switching the foreground color to <span className="font-mono bg-white px-1 border border-red-100 rounded">{result.suggestion}</span> for better visibility.
                    </div>
                  )}
                </div>
              </div>

              {/* WCAG Compliance Blocks */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ComplianceBadge level="AA" type="Normal Text" pass={result.aaNormal} />
                <ComplianceBadge level="AA" type="Large Text" pass={result.aaLarge} />
                <ComplianceBadge level="AAA" type="Normal Text" pass={result.aaaNormal} />
                <ComplianceBadge level="AAA" type="Large Text" pass={result.aaaLarge} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ComplianceBadge({ level, type, pass }) {
  return (
    <div className={`p-4 rounded-lg border ${pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} flex flex-col items-center justify-center text-center`}>
      <span className={`text-2xl font-bold ${pass ? 'text-green-700' : 'text-red-700'}`}>{level}</span>
      <span className="text-xs text-textSecondary mt-1">{type}</span>
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {pass ? 'Pass' : 'Fail'}
      </div>
    </div>
  );
}
