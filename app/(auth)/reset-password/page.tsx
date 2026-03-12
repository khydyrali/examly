"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
      <div className="grid w-full gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur lg:grid-cols-[1fr,420px]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Secure reset</p>
          <h1 className="text-3xl font-bold text-slate-900">Set a new password.</h1>
          <p className="text-sm text-slate-600">
            You opened this page from your email link. Choose a new password to continue learning.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700 shadow-inner">
            Need a new link?{" "}
            <Link href="/forgot-password" className="font-semibold text-slate-900 hover:underline">
              Request another reset email.
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
