"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
      <div className="grid w-full gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur lg:grid-cols-[1fr,420px]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Reset access</p>
          <h1 className="text-3xl font-bold text-slate-900">Forgot your password?</h1>
          <p className="text-sm text-slate-600">We will email you a secure link. After you click it, set a new password instantly.</p>
          <ul className="space-y-2 text-sm text-slate-700">
            {["Secure Supabase magic link", "Expires quickly to keep your account safe", "Works for both email and Google users"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ),
            )}
          </ul>
          <Link href="/" className="inline-flex text-sm font-semibold text-slate-900 hover:underline">
            ← Back to home
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <Suspense fallback={null}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
