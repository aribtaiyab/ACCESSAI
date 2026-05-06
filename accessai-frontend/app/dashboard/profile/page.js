'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getProfile, updateProfile, updatePassword } from '@/lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        if (res.success && res.data) {
          setProfile({
            name: res.data.user_metadata?.name || '',
            email: res.data.email || ''
          });
        }
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profile.email) {
      toast.error('Email is required');
      return;
    }

    setIsProfileLoading(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Failed to update profile';
      if (msg.includes('already exists') || msg.includes('unique')) {
        toast.error('This email is already in use by another account.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsPasswordLoading(true);
    try {
      await updatePassword(passwords.currentPassword, passwords.newPassword);
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Failed to change password';
      if (msg.toLowerCase().includes('incorrect current password')) {
        toast.error('The current password you entered is incorrect.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (isFetching) {
    return (
      <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 border-b border-border pb-6">
          <Link href="/dashboard" className="text-primary font-medium hover:underline flex items-center gap-2">
            <span>←</span> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-6">Profile Settings</h1>
          <p className="text-textSecondary mt-2">Manage your personal information and security.</p>
        </header>

        <div className="space-y-8">
          
          {/* Profile Information Form */}
          <section className="bg-white p-8 rounded-xl border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6">Personal Information</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProfileLoading}
                className="w-full sm:w-auto bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:bg-hover disabled:opacity-70 transition flex items-center justify-center gap-2"
              >
                {isProfileLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </form>
          </section>

          {/* Change Password Form */}
          <section className="bg-white p-8 rounded-xl border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6">Change Password</h2>
            
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">New Password</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Create new password"
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isPasswordLoading}
                className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-70 transition flex items-center justify-center gap-2"
              >
                {isPasswordLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </section>

        </div>
      </div>
    </main>
  );
}
