'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export function SignupForm() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy('email');
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: origin ? `${origin}${redirect.startsWith('/') ? redirect : '/'}` : undefined,
      },
    });
    setBusy(null);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.replace(redirect);
      return;
    }

    setMessage('Check your email to confirm your account. Once confirmed, you will be logged in automatically.');
  };

  const handleGoogle = async () => {
    setError(null);
    setMessage(null);
    setBusy('google');
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin ? `${origin}${redirect.startsWith('/') ? redirect : '/'}` : undefined,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
    setBusy(null);
  };

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Create your account</h2>
        <p className="text-sm text-slate-600">Start building streaks with notes, practice, and flashcards.</p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy === 'google'}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-70"
      >
        <span className="h-5 w-5 rounded-sm bg-gradient-to-br from-sky-500 to-indigo-600" />
        {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="At least 6 characters"
            minLength={6}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy === 'email'}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy === 'email' ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm text-slate-600">
        <span>Already have an account?</span>
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
