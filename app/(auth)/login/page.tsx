"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <AuthLayout
      eyebrow={t.auth.login.eyebrow}
      title={t.auth.login.title}
      description={t.auth.login.description}
      bullets={t.auth.login.bullets}
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
