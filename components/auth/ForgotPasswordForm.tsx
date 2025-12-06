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
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Forgot password</h2>
        <p className="text-sm text-slate-600">We will send a secure reset link to your email.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="you@student.com"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy ? 'Sending reset link…' : 'Send reset link'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Back to login
        </Link>
        <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
