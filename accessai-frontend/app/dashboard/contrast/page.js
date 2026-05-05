/**
 * FILE: accessai-frontend/app/dashboard/contrast/page.js
 * 1. WHAT: Contrast checker page.
 * 2. WHY: Helps check color contrast for accessibility.
 * 3. HOW: Provides contrast checking tool.
 */
'use client';

import Link from 'next/link';

export default function ContrastPage() {
  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-4">Contrast Checker</h1>
        </header>
        <p>Color contrast checking tool coming soon.</p>
      </div>
    </main>
  );
}
