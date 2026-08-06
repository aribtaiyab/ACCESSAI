'use client';

import InternetCompanion from '@/components/InternetCompanion';

export default function InternetCompanionPage() {
  return (
    <main className="bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/80 bg-[linear-gradient(135deg,#FFFDF8_0%,#FAF3E6_100%)] p-8 shadow-[0_25px_70px_-30px_rgba(23,23,23,0.28)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Internet Companion</p>
          <h1 className="mt-3 text-3xl font-semibold text-textPrimary sm:text-4xl">Understand any page with clarity and calm.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-textSecondary">Keep the same functionality, now paired with a more focused and premium experience.</p>
        </div>
        <InternetCompanion />
      </div>
    </main>
  );
}
