'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

const features = [
  {
    title: 'Clarify any text',
    description: 'Make dense writing feel simple, clear, and human.',
    href: '/text-tools',
    cta: 'Open Text Tools',
  },
  {
    title: 'Understand the web',
    description: 'Paste a link or passage and get a calm, structured summary.',
    href: '/internet-companion',
    cta: 'Try Internet Companion',
  },
];

export default function HomePage() {
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallExtension = () => {
    const webstoreUrl = process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL;
    if (webstoreUrl) {
      window.open(webstoreUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // For local developer installation, show the step-by-step installation guide
    setShowInstallGuide(true);
  };

  const copyToClipboard = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <main className="bg-background text-textPrimary">
      <Toaster position="bottom-right" />
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-[2.5rem] border border-border/80 bg-[linear-gradient(135deg,#FFFDF8_0%,#FAF3E6_100%)] p-8 shadow-[0_25px_70px_-30px_rgba(23,23,23,0.28)] sm:p-10 lg:p-14">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Premium writing experience
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-textPrimary sm:text-5xl lg:text-6xl">
              Make the web easier to understand.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-textSecondary sm:text-xl">
              AccessAI helps you simplify ideas, summarize complex content, and understand anything online with a calm, polished workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/text-tools" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-hover">
                Start with Text Tools
              </Link>
              <Link href="/internet-companion" className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary">
                Explore Internet Companion
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="group rounded-[1.75rem] border border-border bg-white/85 p-8 shadow-[0_18px_45px_-24px_rgba(23,23,23,0.2)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_55px_-22px_rgba(23,23,23,0.26)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl text-primary">
                {feature.title.includes('Clarify') ? '✦' : '◌'}
              </div>
              <h2 className="text-2xl font-semibold text-textPrimary">{feature.title}</h2>
              <p className="mt-3 text-base leading-7 text-textSecondary">{feature.description}</p>
              <Link href={feature.href} className="mt-6 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-textPrimary transition hover:border-primary hover:text-primary">
                {feature.cta}
              </Link>
            </article>
          ))}
        </div>

        <section id="install-extension" className="rounded-[2rem] border border-border bg-white/90 p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Chrome Extension</p>
              <h2 className="mt-3 text-3xl font-semibold text-textPrimary">Use AccessAI everywhere you browse.</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-textSecondary">Install the companion extension to bring the same clarity and comprehension to any page you open.</p>
            </div>
            <button onClick={handleInstallExtension} className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-hover">
              Install Extension
            </button>
          </div>
        </section>
      </section>

      {/* Local Extension Installation Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-border bg-[#FFFDF8] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Quick Setup</p>
                <h3 className="mt-1 text-xl font-semibold text-textPrimary">Install AccessAI Extension</h3>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="rounded-full border border-border bg-white p-2 text-textSecondary hover:text-textPrimary"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-textSecondary">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">1</span>
                <div className="flex-1">
                  <p className="font-medium text-textPrimary">Open Extensions in Chrome</p>
                  <p className="mt-0.5 text-xs">Copy and paste this URL in your Chrome address bar:</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded-lg bg-background px-2.5 py-1 text-xs font-mono text-textPrimary">chrome://extensions</code>
                    <button
                      onClick={() => copyToClipboard('chrome://extensions', 'Copied chrome://extensions to clipboard!')}
                      className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">2</span>
                <div className="flex-1">
                  <p className="font-medium text-textPrimary">Enable Developer Mode</p>
                  <p className="mt-0.5 text-xs">Toggle the <strong>Developer mode</strong> switch in the top-right corner.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">3</span>
                <div className="flex-1">
                  <p className="font-medium text-textPrimary">Load Unpacked</p>
                  <p className="mt-0.5 text-xs">Click <strong>Load unpacked</strong> and select the folder:</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded-lg bg-background px-2.5 py-1 text-xs font-mono text-textPrimary">accessai-extension</code>
                    <button
                      onClick={() => copyToClipboard('accessai-extension', 'Copied folder name!')}
                      className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-textPrimary transition hover:border-primary hover:text-primary"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstallGuide(false)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-hover"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

