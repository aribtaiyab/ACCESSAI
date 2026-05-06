/**
 * FILE: accessai-frontend/app/dashboard/page.js
 * 1. WHAT: Dashboard home page.
 * 2. WHY: Main user interface after login showing all available tools.
 * 3. HOW: Displays tool cards linking to specific features. Protected by layout.js.
 */
'use client';

import Link from 'next/link';
import { MessageSquare, Image, Eye, BarChart3, Settings, User, Clock } from 'lucide-react';

export default function DashboardPage() {
  const tools = [
    {
      href: '/dashboard/text',
      icon: MessageSquare,
      title: 'Text Tools',
      description: 'Simplify, explain, and summarize text with AI.',
    },
    {
      href: '/dashboard/image',
      icon: Image,
      title: 'Image Tools',
      description: 'Generate accessible image descriptions.',
    },
    {
      href: '/dashboard/contrast',
      icon: Eye,
      title: 'Contrast Checker',
      description: 'Check color contrast for accessibility.',
    },
    {
      href: '/dashboard/org',
      icon: BarChart3,
      title: 'Audit Tools',
      description: 'Run accessibility audits on websites.',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      title: 'Settings',
      description: 'Manage your accessibility preferences.',
    },
    {
      href: '/dashboard/history',
      icon: Clock,
      title: 'History',
      description: 'View your past AI requests and audits.',
    },
    {
      href: '/dashboard/profile',
      icon: User,
      title: 'Profile',
      description: 'Update your account information.',
    },
  ];

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to AccessAI</h1>
          <p className="text-textSecondary mt-2">Your personal accessibility toolkit</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="block group">
                <article className="rounded-3xl border border-border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-primary">
                  <div className="mb-4 inline-block p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-textPrimary">{tool.title}</h2>
                  <p className="mt-2 text-textSecondary">{tool.description}</p>
                </article>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
