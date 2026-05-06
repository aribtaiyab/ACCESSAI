'use client';

import { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GlobalLoaderContext = createContext();

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

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
        Loading...
      </p>
    </div>
  );
}

function LoaderManager({ children }) {
  const [globalLoading, setGlobalLoading] = useState(false);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Navigation loader completion
  useEffect(() => {
    setGlobalLoading(false);
  }, [pathname, searchParams]);

  return (
    <GlobalLoaderContext.Provider value={{ globalLoading, setGlobalLoading }}>
      {globalLoading && <LoadingOverlay />}
      {children}
    </GlobalLoaderContext.Provider>
  );
}

export function GlobalLoaderProvider({ children }) {
  return (
    <Suspense fallback={
      <GlobalLoaderContext.Provider value={{ globalLoading: false, setGlobalLoading: () => {} }}>
        {children}
      </GlobalLoaderContext.Provider>
    }>
      <LoaderManager>{children}</LoaderManager>
    </Suspense>
  );
}
