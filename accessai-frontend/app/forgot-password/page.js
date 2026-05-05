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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
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
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Forgot Password</h1>
        <p className="text-textSecondary text-sm text-center mb-6">Enter your email to receive a password reset link.</p>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black py-2 rounded-lg font-semibold hover:bg-hover disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-primary hover:underline">Back to login</Link>
        </div>
      </div>
    </main>
  );
}
