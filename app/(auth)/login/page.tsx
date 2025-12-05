"use client";

import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
      <div className="grid w-full gap-10 rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-neutral-900/80 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Admin Access</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Sign in to manage quizzes, flashcards, and revision notes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Uses Supabase email/password auth. Create an admin user in your Supabase project, then sign in here to edit content.
          </p>
          <div className="rounded-xl border border-dashed border-gray-300/70 bg-gray-50/70 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-neutral-800/60 dark:text-gray-200">
            Need to set up Supabase? Add <code className="rounded bg-gray-200 px-1 text-xs text-gray-800">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and <code className="rounded bg-gray-200 px-1 text-xs text-gray-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
          </div>
          <Link href="/" className="inline-flex text-sm text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
