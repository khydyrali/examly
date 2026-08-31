"use client";

import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function SignupPage() {
  const { t } = useLanguage();

  return (
    <AuthLayout
      eyebrow={t.auth.signup.eyebrow}
      title={t.auth.signup.title}
      description={t.auth.signup.description}
      bullets={t.auth.signup.bullets}
      bulletColor="bg-orange-400"
    >
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
