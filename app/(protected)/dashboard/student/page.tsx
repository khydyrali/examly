"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Atom,
  BookOpen,
  Calculator,
  Dna,
  FileQuestion,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Layers,
  Laptop2,
  LineChart,
  Music,
  Palette,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

type Subject = { id: number; name: string | null; code: string | null; image: string | null };

const subjectColors = [
  "from-violet-500 to-fuchsia-500",
  "from-orange-500 to-amber-400",
  "from-teal-500 to-emerald-500",
  "from-sky-500 to-violet-500",
  "from-rose-500 to-pink-500",
  "from-lime-500 to-emerald-500",
  "from-fuchsia-500 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-cyan-500 to-teal-600",
  "from-violet-500 to-violet-600",
];

const subjectIconRules: [RegExp, typeof BookOpen][] = [
  [/phys/i, Atom],
  [/chem/i, FlaskConical],
  [/bio/i, Dna],
  [/math/i, Calculator],
  [/(comput|ict|coding)/i, Laptop2],
  [/(econ|business|account)/i, LineChart],
  [/(hist|history)/i, Landmark],
  [/(geo|geography)/i, Globe2],
  [/(eng|lit|ielts|writing)/i, BookOpen],
  [/(lang|hsk|chinese|spanish|french)/i, Languages],
  [/(art|design)/i, Palette],
  [/music/i, Music],
];

function getSubjectIcon(name: string | null) {
  if (!name) return Sparkles;
  const match = subjectIconRules.find(([pattern]) => pattern.test(name));
  return match ? match[1] : GraduationCap;
}

const quickLinks = [
  { href: "/dashboard/student/note", label: "Notes", desc: "Bite-size summaries", icon: ScrollText, color: "from-violet-500 to-fuchsia-500" },
  { href: "/dashboard/student/flashcard", label: "Flashcards", desc: "Daily streaks & spaced review", icon: Layers, color: "from-orange-500 to-amber-400" },
  { href: "/dashboard/student/quiz", label: "Exam Topical", desc: "Practice by topic", icon: FileQuestion, color: "from-sky-500 to-violet-500" },
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
        {loading ? (
          <p className="text-sm font-semibold text-ink-soft">Loading subjects…</p>
        ) : subjects.length === 0 ? (
          <Card className="p-6 text-sm font-semibold text-ink-soft">No subjects available yet.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, i) => {
              const Icon = getSubjectIcon(subject.name);
              const color = subjectColors[i % subjectColors.length];
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSelectSubject(subject)}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${color} p-5 text-left text-white shadow-pop transition hover:-translate-y-1.5 hover:rotate-1 hover:shadow-xl`}
                >
                  <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl transition group-hover:bg-white/25" />
                  <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                  <div className="relative flex items-start justify-between">
                    {subject.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={subject.image}
                        alt={subject.name ?? "Subject image"}
                        className="h-14 w-14 rounded-2xl border-2 border-white/40 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-sm backdrop-blur-sm">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-sm">
                      {subject.code || "SUB"}
                    </span>
                  </div>

                  <div className="relative mt-5 space-y-1">
                    <p className="font-heading text-lg font-extrabold leading-tight">{subject.name || `Subject ${subject.id}`}</p>
                    <p className="text-xs font-bold text-white/80">Tap to start studying →</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
