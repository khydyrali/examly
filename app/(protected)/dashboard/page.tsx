"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type CountRow = {
  table: string;
  count: number;
  color: string;
};

type Subject = { id: number; name: string | null; code: string | null; image: string | null };

export default function DashboardPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [counts, setCounts] = useState<CountRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const tables = useMemo(
    () => [
      { table: "quiz", label: "Quizzes", color: "#3b82f6" },
      { table: "flashcard", label: "Flashcards", color: "#22c55e" },
      { table: "note", label: "Notes", color: "#f59e0b" },
    ],
    [],
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const rawCache = typeof window !== "undefined" ? localStorage.getItem("subjects_cache") : null;
      let cachedSubjects: Subject[] | null = null;
      if (rawCache) {
        try {
          cachedSubjects = JSON.parse(rawCache);
          setSubjects(cachedSubjects);
        } catch {
          // ignore parse error, will refetch
        }
      }
      const results: CountRow[] = [];
      for (const t of tables) {
        const { count } = await supabase.from(t.table).select("*", { count: "exact", head: true });
        results.push({ table: t.label, count: count ?? 0, color: t.color });
      }
      const shouldFetchSubjects = !cachedSubjects || cachedSubjects.length === 0;
      const [{ data: subjectData }, { count: profileCount }] = await Promise.all([
        shouldFetchSubjects ? supabase.from("subject").select("id, name, code, image").order("name", { ascending: true }) : Promise.resolve({ data: null }),
        // Adjust this table name if your user records live elsewhere.
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      if (subjectData) {
        setSubjects(subjectData ?? []);
        try {
          localStorage.setItem("subjects_cache", JSON.stringify(subjectData ?? []));
        } catch {
          // ignore storage errors
        }
      }
      setUsersCount(profileCount ?? 0);
      setCounts(results);
      setLoading(false);
    };
    void run();
  }, [supabase, tables]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Content overview</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quick glance at your quiz, flashcard, and note volumes. Use the menu to edit each type.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Users</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">
            {loading || usersCount === null ? "…" : usersCount}
          </p>
          <p className="text-xs text-blue-600">Total profiles</p>
        </div>
        {tables.map((t) => {
          const count = counts.find((c) => c.table === t.label)?.count ?? 0;
          return (
            <Link
              key={t.table}
              href={`/dashboard/${t.table}`}
              className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-neutral-900"
            >
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">{loading ? "…" : count}</p>
              <p className="text-xs text-blue-600">Manage →</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Subjects</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Available subjects</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review subject coverage at a glance.</p>
          </div>
          <Link href="/dashboard/subject" className="text-sm text-blue-600 hover:underline">
            Manage subjects
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(subjects ?? []).slice(0, 9).map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => {
                localStorage.setItem("subject_id", String(subject.id));
                router.push("/dashboard/flashcard");
              }}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md dark:border-gray-800 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-neutral-900"
            >
              {subject.image ? (
                <img src={subject.image} alt={subject.name ?? "Subject image"} className="h-12 w-12 rounded-md object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                  {subject.code?.slice(0, 3)?.toUpperCase() || "SUB"}
                </div>
              )}
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{subject.name || `Subject ${subject.id}`}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{subject.code || "—"}</div>
              </div>
            </button>
          ))}
          {subjects.length === 0 && !loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No subjects found.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
