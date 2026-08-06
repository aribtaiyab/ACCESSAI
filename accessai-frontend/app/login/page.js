/**
 * FILE: accessai-frontend/app/login/page.js
 * 1. WHAT: Login page with form.
 * 2. WHY: Allows users to authenticate.
 * 3. HOW: Uses AuthContext login and redirects on success.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useGlobalLoader } from '@/context/GlobalLoaderContext';

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { setGlobalLoading } = useGlobalLoader();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    const email = data.email?.trim();
    const password = data.password;

    if (!email) {
      toast.error('Email is required.');
      return;
    }
    if (!password) {
      toast.error('Password is required.');
      return;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      toast.error('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setGlobalLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      router.push('/text-tools');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/95 p-8 shadow-[0_22px_60px_-28px_rgba(23,23,23,0.3)] sm:p-10">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">AccessAI</p>
            <h1 className="mt-3 text-3xl font-semibold text-textPrimary">Sign In</h1>
            <p className="mt-2 text-sm text-textSecondary">Welcome back. Continue with your workspace.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-textPrimary">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-textPrimary shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-textPrimary">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-textPrimary shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-5 text-center text-sm text-textSecondary">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="mt-2 text-center text-sm text-textSecondary">
            <Link href="/signup" className="font-medium text-primary hover:underline">Don&apos;t have an account? Sign up</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
