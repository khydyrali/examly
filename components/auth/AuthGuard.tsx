'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '../providers/SupabaseProvider';

function getRoleFromToken(token?: string | null) {
  if (!token || typeof window === 'undefined') return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    const claims = JSON.parse(decoded) as {
      user_role?: unknown;
      app_metadata?: { user_role?: unknown };
      user_metadata?: { user_role?: unknown };
    };
    const role = claims.user_role ?? claims.app_metadata?.user_role ?? claims.user_metadata?.user_role;
    return typeof role === 'string' ? role : null;
  } catch (error) {
    console.warn('Failed to parse JWT for user role in guard', error);
    return null;
  }
}

function getUserRole(session: ReturnType<typeof useSupabase>['session']) {
  const appRole = session?.user?.app_metadata?.user_role;
  const userRole = session?.user?.user_metadata?.user_role;
  const role = appRole ?? userRole;
  if (typeof role === 'string') return role;
  return getRoleFromToken(session?.access_token ?? null);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!session) {
      const redirect = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirect}`);
    }
  }, [isReady, session, router, pathname]);

  useEffect(() => {
    if (!isReady || !session || !pathname) return;
    const role = getUserRole(session);
    const isStudentPath = pathname.startsWith('/dashboard/student');
    if (role === 'student' && !isStudentPath) {
      router.replace('/dashboard/student');
    }
  }, [isReady, pathname, router, session]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking session...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
