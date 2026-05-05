/**
 * FILE: accessai-frontend/app/login/page.js
 * 1. WHAT: Login page with form.
 * 2. WHY: Allows users to authenticate.
 * 3. HOW: Uses Supabase auth and redirects on success.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black py-2 rounded-lg font-semibold hover:bg-hover disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <div className="mt-2 text-center">
          <Link href="/signup" className="text-primary hover:underline">Don't have an account? Sign up</Link>
        </div>
      </div>
    </main>
  );
}
