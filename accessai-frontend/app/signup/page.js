/**
 * FILE: accessai-frontend/app/signup/page.js
 * 1. WHAT: Signup page with form.
 * 2. WHY: Allows users to register.
 * 3. HOW: Calls backend API to create user, then auto-signs in and redirects to dashboard.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      // Step 1: Call backend to create user (with auto-confirmed email)
      const response = await axios.post(`${backendUrl}/api/auth/signup`, {
        email: data.email,
        password: data.password,
      });

      if (!response.data.success) {
        toast.error(response.data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Step 2: Auto sign-in the user with the same credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        toast.error('Signup successful, but auto-login failed. Please sign in manually.');
        router.push('/login');
      } else {
        toast.success('Signup successful!');
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Signup failed. Please try again.';
      toast.error(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
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
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-primary hover:underline">Already have an account? Sign in</Link>
        </div>
      </div>
    </main>
  );
}
