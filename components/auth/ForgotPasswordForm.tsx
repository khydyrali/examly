'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export function ForgotPasswordForm() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: origin ? `${origin}/reset-password` : undefined,
    });
    setBusy(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('Check your email for a reset link. After clicking it, set a new password on the next screen.');
  };

  return (
    <div className="w-full max-w-md space-y-5 rounded-3xl border-2 border-violet-100 bg-white p-6 shadow-pop sm:p-7">
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl font-extrabold text-ink">Forgot password</h2>
        <p className="text-sm font-semibold text-ink-soft">We will send a secure reset link to your email.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-violet-100 bg-white px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="you@student.com"
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy ? 'Sending reset link…' : 'Send reset link'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm font-semibold text-ink-soft">
        <Link href="/login" className="font-bold text-violet-700 hover:underline">
          Back to login
        </Link>
        <Link href="/signup" className="font-bold text-violet-700 hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
