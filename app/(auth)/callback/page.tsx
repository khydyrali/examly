"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function AuthCallbackPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSession = async () => {
      const { error: sessionError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      const redirect = sanitizeRedirect(searchParams.get("redirect"));
      router.replace(redirect);
    };
    void handleSession();
  }, [router, searchParams, supabase.auth]);

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
