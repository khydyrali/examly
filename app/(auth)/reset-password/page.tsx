"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Secure reset"
      title="Set a new password."
      description="You opened this page from your email link. Choose a new password to keep learning."
      bullets={["Encrypted end-to-end via Supabase", "Takes less than a minute", "You'll be signed in right after"]}
      bulletColor="bg-teal-400"
    >
      <div className="w-full max-w-md space-y-4">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <div className="rounded-2xl border-2 border-subtle bg-subtle/40 p-4 text-center text-sm font-semibold text-ink-soft">
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-bold text-violet-700 hover:underline">
            Request another reset email.
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
