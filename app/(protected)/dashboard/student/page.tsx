"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Subject = { id: number; name: string | null; code: string | null; image: string | null };

export default function StudentDashboardPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("subject").select("id, name, code, image").order("name", { ascending: true });
      setSubjects(data ?? []);
      setLoading(false);
    };

    void load();
  }, [supabase]);

  const handleSelectSubject = (subject: Subject) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("subject_id", String(subject.id));
      const label = subject.code ? `${subject.code} - ${subject.name ?? ""}`.trim() : subject.name ?? String(subject.id);
      localStorage.setItem("subject_label", label);
    }
    router.push("/dashboard/student/flashcard");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Student Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Choose a subject</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Pick a subject to jump into its flashcards.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">Loading subjects…</div>
          ) : subjects.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No subjects available yet.</div>
          ) : (
            subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => handleSelectSubject(subject)}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
