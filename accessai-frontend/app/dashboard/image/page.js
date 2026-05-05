/**
 * FILE: accessai-frontend/app/dashboard/image/page.js
 * 1. WHAT: Image tools page.
 * 2. WHY: Provides image accessibility tools.
 * 3. HOW: Allows users to upload images and get descriptions.
 */
'use client';

import Link from 'next/link';

export default function ImagePage() {
  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-4">Image Tools</h1>
        </header>
        <p>Image accessibility tools coming soon.</p>
      </div>
    </main>
  );
}
