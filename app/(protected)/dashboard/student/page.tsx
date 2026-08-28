"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, FileQuestion, GraduationCap, Layers, ScrollText } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

type Subject = { id: number; name: string | null; code: string | null; image: string | null };

const subjectColors = [
  "from-violet-500 to-fuchsia-500",
  "from-orange-500 to-amber-400",
  "from-teal-500 to-emerald-500",
  "from-sky-500 to-indigo-500",
  "from-rose-500 to-pink-500",
  "from-lime-500 to-emerald-500",
];

const quickLinks = [
  { href: "/dashboard/student/note", label: "Notes", desc: "Bite-size summaries", icon: ScrollText, color: "from-violet-500 to-fuchsia-500" },
  { href: "/dashboard/student/flashcard", label: "Flashcards", desc: "Daily streaks & spaced review", icon: Layers, color: "from-orange-500 to-amber-400" },
  { href: "/dashboard/student/quiz", label: "Exam Topical", desc: "Practice by topic", icon: FileQuestion, color: "from-sky-500 to-indigo-500" },
  { href: "/dashboard/student/past-paper", label: "Past Papers", desc: "Every subject, year & session", icon: BookOpen, color: "from-teal-500 to-emerald-500" },
  { href: "/dashboard/student/mock-exam", label: "Mock Exams", desc: "Full timed practice", icon: GraduationCap, color: "from-rose-500 to-pink-500" },
];

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
    <div className="space-y-10">
      <div className="space-y-2">
        <Badge color="violet">Student Dashboard</Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Hey there! What are we studying today?</h1>
        <p className="text-sm font-semibold text-ink-soft">Jump into a subject, or head straight to your favorite study tool.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="flex h-full flex-col gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${link.color} text-white shadow-sm`}>
                <link.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-ink">{link.label}</p>
                <p className="text-xs font-semibold text-ink-soft">{link.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-xl font-extrabold text-ink">Choose a subject</h2>
        <Card className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="text-sm font-semibold text-ink-soft">Loading subjects…</div>
            ) : subjects.length === 0 ? (
              <div className="text-sm font-semibold text-ink-soft">No subjects available yet.</div>
            ) : (
              subjects.map((subject, i) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSelectSubject(subject)}
                  className="flex items-center gap-3 rounded-2xl border-2 border-violet-100 bg-white px-4 py-3 text-left text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >
                  {subject.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={subject.image} alt={subject.name ?? "Subject image"} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${subjectColors[i % subjectColors.length]} text-xs font-extrabold text-white`}>
                      {subject.code?.slice(0, 3)?.toUpperCase() || "SUB"}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="font-heading text-sm font-bold text-ink">{subject.name || `Subject ${subject.id}`}</div>
                    <div className="text-xs font-semibold text-ink-soft">{subject.code || "—"}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
