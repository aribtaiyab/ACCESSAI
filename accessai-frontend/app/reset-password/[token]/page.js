/**
 * FILE: accessai-frontend/app/reset-password/[token]/page.js
 * 1. WHAT: Reset password page with token.
 * 2. WHY: Allows users to set new password after clicking reset link.
 * 3. HOW: Submits new password to backend with token.
 */
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${backendUrl}/api/auth/reset-password`,
        { token, password: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        toast.success('Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(response.data.error || 'Failed to reset password.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password.';
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black py-2 rounded-lg font-semibold hover:bg-hover disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
