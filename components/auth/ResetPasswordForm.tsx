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
      <div className="w-full max-w-md rounded-3xl border-2 border-subtle bg-surface p-6 text-center shadow-pop">
        <p className="text-sm font-semibold text-ink-soft">Preparing secure reset…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-3xl border-2 border-subtle bg-surface p-6 text-center shadow-pop">
        <h2 className="font-heading text-xl font-extrabold text-ink">Reset link expired</h2>
        <p className="text-sm font-semibold text-ink-soft">Request a new password reset link to continue.</p>
        <div className="flex justify-center gap-3 text-sm font-bold">
          <Link href="/forgot-password" className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-white shadow-pop">
            Send new link
          </Link>
          <Link href="/login" className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-ink">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-5 rounded-3xl border-2 border-subtle bg-surface p-6 shadow-pop sm:p-7">
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl font-extrabold text-ink">Set a new password</h2>
        <p className="text-sm font-semibold text-ink-soft">You reached this screen from a secure reset link.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="Repeat password"
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy ? 'Updating…' : 'Save new password'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm font-semibold text-ink-soft">
        <Link href="/login" className="font-bold text-violet-700 hover:underline">
          Back to login
        </Link>
        <Link href="/" className="font-bold text-violet-700 hover:underline">
          Home
        </Link>
      </div>
    </div>
  );
}
