'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export function ResetPasswordForm() {
  const { supabase, session, isReady } = useSupabase();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Password updated. Redirecting to dashboard…');
    setTimeout(() => router.replace('/dashboard'), 1200);
  };

  if (!isReady) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-lg">
        <p className="text-sm text-slate-600">Preparing secure reset…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Reset link expired</h2>
        <p className="text-sm text-slate-600">Request a new password reset link to continue.</p>
        <div className="flex justify-center gap-3 text-sm font-semibold text-slate-900">
          <Link href="/forgot-password" className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm">
            Send new link
          </Link>
          <Link href="/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Set a new password</h2>
        <p className="text-sm text-slate-600">You reached this screen from a secure reset link.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Repeat password"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy ? 'Updating…' : 'Save new password'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Back to login
        </Link>
        <Link href="/" className="font-semibold text-slate-900 hover:underline">
          Home
        </Link>
      </div>
    </div>
  );
}
