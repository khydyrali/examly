'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useSupabase } from '../providers/SupabaseProvider';

function sanitizeRedirect(value: string | null) {
  if (!value) return '/dashboard';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      return url.pathname || '/dashboard';
    } catch {
      return '/dashboard';
    }
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function getRoleFromToken(token?: string | null) {
  if (!token || typeof window === 'undefined') return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    const claims = JSON.parse(decoded) as {
      user_role?: unknown;
      app_metadata?: { user_role?: unknown };
      user_metadata?: { user_role?: unknown };
    };
    const role = claims.user_role ?? claims.app_metadata?.user_role ?? claims.user_metadata?.user_role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

function getUserRole(session: Session | null) {
  const appRole = session?.user?.app_metadata?.user_role;
  const userRole = session?.user?.user_metadata?.user_role;
  const role = appRole ?? userRole;
  if (typeof role === 'string') return role;
  return getRoleFromToken(session?.access_token ?? null);
}

export function LoginForm() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeRedirect(searchParams.get('redirect'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy('email');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(null);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const role = getUserRole(data?.session ?? null);
    const destination = role === 'student' ? '/dashboard/student' : redirect;
    router.replace(destination);
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy('google');
    const baseUrl =
      (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') : undefined) ??
      (typeof window !== 'undefined' ? window.location.origin : undefined);
    const redirectPath = sanitizeRedirect(redirect);
    const redirectTo = baseUrl ? `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}` : undefined;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
    setBusy(null);
  };

  return (
    <div className="w-full max-w-md space-y-5 rounded-3xl border-2 border-subtle bg-surface p-6 shadow-pop sm:p-7">
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl font-extrabold text-ink">Log in</h2>
        <p className="text-sm font-semibold text-ink-soft">Use email/password or continue with Google.</p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy === 'google'}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-subtle bg-surface px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 disabled:opacity-70"
      >
        <svg viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6 1.54 7.38 2.83l5.4-5.26C33.64 3.38 29.2 1.5 24 1.5 14.66 1.5 6.66 7.46 3.44 15.34l6.77 5.26C11.54 14.6 17.26 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.56-.14-3.06-.4-4.5H24v9h12.7c-.55 2.8-2.2 5.18-4.7 6.78l7.14 5.52C43.82 37.7 46.5 31.6 46.5 24.5z" />
          <path fill="#FBBC05" d="M10.21 28.06c-.48-1.4-.76-2.9-.76-4.56 0-1.58.28-3.1.76-4.5L3.44 13.7A22.4 22.4 0 0 0 1.5 23.5c0 3.56.84 6.92 2.34 9.8z" />
          <path fill="#34A853" d="M24 46.5c6.5 0 11.94-2.14 15.92-5.92l-7.14-5.52c-1.98 1.34-4.52 2.14-8.78 2.14-6.74 0-12.46-5.1-14.3-11.9l-6.77 5.26C6.66 40.54 14.66 46.5 24 46.5z" />
          <path fill="none" d="M1.5 1.5h45v45h-45z" />
        </svg>
        {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft/60">
        <div className="h-px flex-1 bg-subtle-strong" />
        <span>or</span>
        <div className="h-px flex-1 bg-subtle-strong" />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="you@student.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="••••••••"
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy === 'email'}
          className="w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy === 'email' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm font-semibold text-ink-soft">
        <Link href="/forgot-password" className="font-bold text-violet-700 hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="font-bold text-violet-700 hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
