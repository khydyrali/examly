'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import { useLanguage } from '../providers/LanguageProvider';

export function ResetPasswordForm() {
  const { supabase, session, isReady } = useSupabase();
  const { t } = useLanguage();
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
      setError(t.auth.resetPassword.passwordMismatch);
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(t.auth.resetPassword.successMessage);
    setTimeout(() => router.replace('/dashboard'), 1200);
  };

  if (!isReady) {
    return (
      <div className="w-full max-w-md rounded-3xl border-2 border-subtle bg-surface p-6 text-center shadow-pop">
        <p className="text-sm font-semibold text-ink-soft">{t.auth.resetPassword.preparing}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-3xl border-2 border-subtle bg-surface p-6 text-center shadow-pop">
        <h2 className="font-heading text-xl font-extrabold text-ink">{t.auth.resetPassword.expiredTitle}</h2>
        <p className="text-sm font-semibold text-ink-soft">{t.auth.resetPassword.expiredDesc}</p>
        <div className="flex justify-center gap-3 text-sm font-bold">
          <Link href="/forgot-password" className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-white shadow-pop">
            {t.auth.resetPassword.sendNewLink}
          </Link>
          <Link href="/login" className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-ink">
            {t.auth.resetPassword.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-5 rounded-3xl border-2 border-subtle bg-surface p-6 shadow-pop sm:p-7">
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl font-extrabold text-ink">{t.auth.resetPassword.heading}</h2>
        <p className="text-sm font-semibold text-ink-soft">{t.auth.resetPassword.subheading}</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">{t.auth.resetPassword.newPasswordLabel}</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder={t.auth.resetPassword.newPasswordPlaceholder}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ink">{t.auth.resetPassword.confirmPasswordLabel}</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder={t.auth.resetPassword.confirmPasswordPlaceholder}
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-pop transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {busy ? t.auth.resetPassword.submitBusy : t.auth.resetPassword.submit}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between text-sm font-semibold text-ink-soft">
        <Link href="/login" className="font-bold text-violet-700 hover:underline">
          {t.auth.resetPassword.backToLogin}
        </Link>
        <Link href="/" className="font-bold text-violet-700 hover:underline">
          {t.auth.resetPassword.home}
        </Link>
      </div>
    </div>
  );
}
