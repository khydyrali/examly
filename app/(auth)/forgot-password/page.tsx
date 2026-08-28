"use client";

import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Reset access"
      title="Forgot your password?"
      description="No worries! We'll email you a secure link. Click it and set a new password in seconds."
      bullets={["Secure Supabase magic link", "Expires quickly to keep your account safe", "Works for email and Google accounts"]}
    >
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
