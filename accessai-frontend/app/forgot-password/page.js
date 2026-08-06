/**
 * FILE: accessai-frontend/app/forgot-password/page.js
 * 1. WHAT: Forgot password page.
 * 2. WHY: Allows users to reset password.
 * 3. HOW: Submits email to backend and receives reset link.
 */
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://accessai-backend-lx57.onrender.com').replace(/\/$/, '');
      const response = await axios.post(
        `${backendUrl}/api/auth/forgot-password`,
        data,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        toast.success('Reset email sent! Check your inbox.');
      } else {
        toast.error(response.data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send reset email.';
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/95 p-8 shadow-[0_22px_60px_-28px_rgba(23,23,23,0.3)] sm:p-10">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">AccessAI</p>
            <h1 className="mt-3 text-3xl font-semibold text-textPrimary">Forgot Password</h1>
            <p className="mt-2 text-sm text-textSecondary">Enter your email to receive a password reset link.</p>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>
          <div className="mt-5 text-center text-sm text-textSecondary">
            <Link href="/login" className="font-medium text-primary hover:underline">Back to login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
