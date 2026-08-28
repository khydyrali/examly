"use client";

import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignupPage() {
  return (
    <AuthLayout
      eyebrow="Start free"
      title="Create your Examly account."
      description="Sign up with email or Google. Built for IGCSE, A Levels, AP, SAT, IELTS & HSK students who want study time to feel fun."
      bullets={["Personalized weekly plan", "Exam-style practice with instant marking", "A huge past papers library, sorted for you"]}
      bulletColor="bg-orange-400"
    >
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
