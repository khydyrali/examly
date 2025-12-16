"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

function sanitizeRedirect(value: string | null) {
  if (!value) return "/dashboard";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.pathname || "/dashboard";
    } catch {
      return "/dashboard";
    }
  }
  return value.startsWith("/") ? value : `/${value}`;
}

function AuthCallbackContent() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSession = async () => {
      if (typeof window === "undefined") return;

      const currentUrl = new URL(window.location.href);
      const redirectParam = currentUrl.searchParams.get("redirect");
      const hasCode = !!currentUrl.searchParams.get("code");

      if (hasCode) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(currentUrl.toString());
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
      } else {
        // Handle implicit flow with tokens in hash fragment
        const hash = window.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: setErrorResult } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErrorResult) {
            setError(setErrorResult.message);
            return;
          }
        } else {
          setError("No auth code or tokens found in callback URL.");
          return;
        }
      }
      const redirect = sanitizeRedirect(redirectParam);
      router.replace(redirect);
    };
    void handleSession();
  }, [router, supabase.auth]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-800">Completing sign-in…</p>
        <p className="mt-1 text-xs text-slate-500">Please wait while we finish authenticating your account.</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-800">Completing sign-in…</p>
            <p className="mt-1 text-xs text-slate-500">Please wait while we finish authenticating your account.</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
