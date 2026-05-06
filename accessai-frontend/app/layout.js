/**
 * FILE: app/layout.js
 * 
 * 1. WHAT: Root layout component for the Next.js application.
 * 2. WHY: Defines the shared UI (like HTML, body tags) for all pages.
 * 3. HOW: Automatically used by Next.js to wrap all pages.
 */

import './globals.css';
import { Inter } from 'next/font/google';
import { SettingsProvider } from '@/context/SettingsContext';
import { GlobalLoaderProvider } from '@/context/GlobalLoaderContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AccessAI – AI Accessibility Companion',
  description: 'AI-powered accessibility tools for everyone.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SettingsProvider>
          <GlobalLoaderProvider>
            {children}
          </GlobalLoaderProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
