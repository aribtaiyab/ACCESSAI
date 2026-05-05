/**
 * FILE: accessai-frontend/app/dashboard/org/page.js
 * 1. WHAT: Organization audit page.
 * 2. WHY: Provides website accessibility audits.
 * 3. HOW: Allows users to run audits.
 */
'use client';

import Link from 'next/link';

export default function OrgPage() {
  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-4">Audit Tools</h1>
        </header>
        <p>Website accessibility audits coming soon.</p>
      </div>
    </main>
  );
}
