"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ResetPasswordPage() {
  const { t } = useLanguage();

  return (
    <AuthLayout
      eyebrow={t.auth.resetPassword.eyebrow}
      title={t.auth.resetPassword.title}
      description={t.auth.resetPassword.description}
      bullets={t.auth.resetPassword.bullets}
      bulletColor="bg-teal-400"
    >
      <div className="w-full max-w-md space-y-4">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <div className="rounded-2xl border-2 border-subtle bg-subtle/40 p-4 text-center text-sm font-semibold text-ink-soft">
          {t.auth.resetPassword.needNewLinkPrefix}
          <Link href="/forgot-password" className="font-bold text-violet-700 hover:underline">
            {t.auth.resetPassword.needNewLinkAction}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
