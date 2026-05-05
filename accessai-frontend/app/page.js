import Link from 'next/link';

/**
 * FILE: accessai-frontend/app/page.js
 * 1. WHAT: Application home page.
 * 2. WHY: Provides users with an overview and navigation.
 * 3. HOW: Renders the main entrypoint for the site.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 rounded-3xl border border-border bg-white p-10 shadow-sm">
          <span className="inline-flex rounded-full bg-primary/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            AccessAI
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            AI accessibility tools built for modern teams.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-textSecondary md:text-lg">
            AccessAI helps you simplify text, create accessible image descriptions, run accessibility audits, and manage project settings from one easy-to-use interface.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:shadow-md">
            <h2 className="text-2xl font-semibold">Text & content helpers</h2>
            <p className="mt-3 text-textSecondary">
              Simplify explanations, summarize long text, and generate accessible content with AI assistance.
            </p>
            <Link href="/dashboard/text" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-hover">
              Open text tools
            </Link>
          </article>

          <article className="rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:shadow-md">
            <h2 className="text-2xl font-semibold">Dashboard & audit tools</h2>
            <p className="mt-3 text-textSecondary">
              Track accessibility audits, review insights, and keep your digital experiences inclusive.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-hover">
              View dashboard
            </Link>
          </article>

          <article className="rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:shadow-md">
            <h2 className="text-2xl font-semibold">Authentication</h2>
            <p className="mt-3 text-textSecondary">
              Log in securely, recover access, and manage your profile with built-in auth routes.
            </p>
            <Link href="/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-hover">
              Sign in
            </Link>
          </article>

          <article className="rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:shadow-md">
            <h2 className="text-2xl font-semibold">Ready for development</h2>
            <p className="mt-3 text-textSecondary">
              Run the app locally with a stable backend and frontend setup using npm commands.
            </p>
            <Link href="/signup" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-hover">
              Get started
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
