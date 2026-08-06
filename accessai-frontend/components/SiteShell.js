'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/text-tools', label: 'Text Tools' },
  { href: '/internet-companion', label: 'Internet Companion' },
  { href: '/#install-extension', label: 'Install Extension' },
];

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-[1.05rem] font-semibold tracking-tight text-textPrimary">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white p-1 shadow-sm">
              <img src="/logo.svg" alt="AccessAI logo" className="h-full w-full" />
            </span>
            <span>AccessAI</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-white/70 p-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-primary text-black shadow-sm' : 'text-textSecondary hover:bg-[#FFF7E8] hover:text-textPrimary'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-medium text-textSecondary sm:inline-block max-w-[140px] truncate" title={user?.email}>
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary shadow-sm transition hover:border-error hover:text-error"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-textPrimary shadow-sm transition hover:border-primary hover:text-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/70 bg-[#FFFDF8]/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-textSecondary sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 AccessAI. Crafted for fast, thoughtful reading.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-primary">
              GitHub
            </a>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="transition hover:text-primary">
                Sign Out
              </button>
            ) : (
              <Link href="/login" className="transition hover:text-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
