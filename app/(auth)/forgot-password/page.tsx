"use client";

import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();

  return (
    <AuthLayout
      eyebrow={t.auth.forgotPassword.eyebrow}
      title={t.auth.forgotPassword.title}
      description={t.auth.forgotPassword.description}
      bullets={t.auth.forgotPassword.bullets}
    >
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
