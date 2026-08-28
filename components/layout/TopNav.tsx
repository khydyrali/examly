'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useSupabase } from '../providers/SupabaseProvider';

export function TopNav() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b-2 border-violet-100 bg-white/90 backdrop-blur dark:border-violet-900/40 dark:bg-surface/90">
      <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 text-sm">
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/dashboard"
              className={`rounded-full px-3 py-1.5 font-bold ${
                pathname === '/dashboard'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop'
                  : 'text-ink-soft hover:bg-violet-50'
              }`}
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden rounded-full bg-violet-50 px-3 py-1.5 font-bold text-violet-700 sm:inline-flex">
            {session?.user.email ?? 'Logged in'}
          </span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-100 px-3 py-1.5 font-bold text-ink transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
