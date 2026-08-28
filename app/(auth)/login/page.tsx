"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in and keep your streak going."
      description="Jump back into your notes, practice sets, flashcards, and past papers. Works with email/password or Google."
      bullets={["See your weakest topics instantly", "Continue timed practice where you stopped", "Synced across IGCSE, A Levels, AP & more"]}
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
