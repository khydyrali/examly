'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useSupabase } from '../providers/SupabaseProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function TopNav() {
  const { supabase, session } = useSupabase();
  const { t } = useLanguage();
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
                  : 'text-ink-soft hover:bg-subtle/40'
              }`}
            >
              {t.topnav.dashboard}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <LanguageSwitcher />
          <span className="hidden rounded-full bg-subtle/40 px-3 py-1.5 font-bold text-violet-700 dark:text-violet-300 sm:inline-flex">
            {session?.user.email ?? t.topnav.loggedIn}
          </span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-subtle px-3 py-1.5 font-bold text-ink transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
          >
            <LogOut className="h-4 w-4" />
            {t.topnav.signOut}
          </button>
        </div>
      </div>
    </header>
  );
}
