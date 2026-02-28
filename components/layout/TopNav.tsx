'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/80 backdrop-blur dark:border-gray-800/70 dark:bg-neutral-900/80">
      <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 text-sm">
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/dashboard"
              className={`rounded px-3 py-1 ${pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" aria-hidden />
          <span className="text-gray-600 dark:text-gray-300">
            {session?.user.email ?? 'Logged in'}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
