'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// 1. Create Context
const GlobalLoaderContext = createContext({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

export const GlobalLoaderProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  // 2. Automatically hide loader on route changes
  useEffect(() => {
    setLoadingCount(0); 
  }, [pathname, searchParams]);

  // 3. Intercept Fetch API globally to detect API calls automatically
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      startLoading();
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        // Use a tiny delay to prevent rapid flashing
        setTimeout(stopLoading, 300);
      }
    };

    // Intercept XMLHttpRequest (for older libraries / Axios defaults)
    const originalXHR = window.XMLHttpRequest;
    function newXHR() {
      const xhr = new originalXHR();
      xhr.addEventListener('loadstart', () => startLoading());
      xhr.addEventListener('loadend', () => setTimeout(stopLoading, 300));
      return xhr;
    }
    window.XMLHttpRequest = newXHR;

    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXHR;
    };
  }, [startLoading, stopLoading]);

  // 4. Handle initial page load
  useEffect(() => {
    startLoading();
    const handleLoad = () => stopLoading();
    
    if (document.readyState === 'complete') {
      setTimeout(stopLoading, 500); // Artificial delay for aesthetic effect on fast loads
    } else {
      window.addEventListener('load', handleLoad);
    }
    
    return () => window.removeEventListener('load', handleLoad);
  }, [startLoading, stopLoading]);

  const isLoading = loadingCount > 0;

  return (
    <GlobalLoaderContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      <AILoaderOverlay isActive={isLoading} />
    </GlobalLoaderContext.Provider>
  );
};

// 5. The Intelligent UI Component
const AILoaderOverlay = ({ isActive }) => {
  const [render, setRender] = useState(isActive);

  useEffect(() => {
    if (isActive) setRender(true);
  }, [isActive]);

  const handleTransitionEnd = () => {
    if (!isActive) setRender(false);
  };

  if (!render) return null;

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center transition-opacity duration-500 ease-in-out"
      style={{
        background: 'rgba(5, 5, 10, 0.6)',
        backdropFilter: 'blur(8px)',
        opacity: isActive ? 1 : 0,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Modern SaaS Neural Animation */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Pulsing Core */}
          <div className="absolute w-8 h-8 rounded-full bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute w-6 h-6 rounded-full bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,1)]"></div>
          
          {/* Floating Neural Nodes */}
          <div className="absolute w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_15px_rgba(192,132,252,1)]" 
               style={{ animation: 'orbit-1 3s infinite ease-in-out' }}></div>
          <div className="absolute w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_10px_rgba(244,114,182,1)]" 
               style={{ animation: 'orbit-2 4s infinite ease-in-out' }}></div>
          <div className="absolute w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)]" 
               style={{ animation: 'orbit-3 3.5s infinite ease-in-out' }}></div>
               
          {/* Connecting Rings */}
          <div className="absolute w-16 h-16 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
               style={{ animation: 'spin 4s linear infinite' }}></div>
          <div className="absolute w-20 h-20 rounded-full border border-purple-500/20" 
               style={{ animation: 'spin 6s linear infinite reverse' }}></div>
        </div>

        {/* Dynamic Text */}
        <div className="text-white/90 font-medium tracking-[0.15em] text-sm uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
          Processing
        </div>
      </div>

      {/* Global Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orbit-1 {
          0%, 100% { transform: translate(-30px, -30px) scale(1); }
          50% { transform: translate(30px, 30px) scale(1.3); }
        }
        @keyframes orbit-2 {
          0%, 100% { transform: translate(35px, -15px) scale(1); }
          50% { transform: translate(-35px, 20px) scale(1.5); }
        }
        @keyframes orbit-3 {
          0%, 100% { transform: translate(-20px, 35px) scale(1.2); }
          50% { transform: translate(25px, -35px) scale(0.8); }
        }
      `}} />
    </div>
  );
};
