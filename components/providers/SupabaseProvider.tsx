'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
  isReady: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }

    return createClient(url, anonKey, {
      auth: {
        storageKey: 'flex-admin-auth',
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.warn('Resetting Supabase session after refresh error', error);
        await supabase.auth.signOut();
        setSession(null);
        setIsReady(true);
        return;
      }

      setSession(data.session ?? null);
      setIsReady(true);
    };

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsReady(true);
        return;
      }

      setSession(newSession);
      setIsReady(true);
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session, isReady }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return ctx;
}
