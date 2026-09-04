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
import { useLanguage } from "@/components/providers/LanguageProvider";
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

const quickLinkIcons = [
  { id: "notes", href: "/dashboard/student/note", icon: ScrollText, color: "from-violet-500 to-fuchsia-500" },
  { id: "flashcards", href: "/dashboard/student/flashcard", icon: Layers, color: "from-orange-500 to-amber-400" },
  { id: "quiz", href: "/dashboard/student/quiz", icon: FileQuestion, color: "from-sky-500 to-violet-500" },
  { id: "pastPapers", href: "/dashboard/student/past-paper", icon: BookOpen, color: "from-teal-500 to-emerald-500" },
  { id: "mockExams", href: "/dashboard/student/mock-exam", icon: GraduationCap, color: "from-rose-500 to-pink-500" },
] as const;

export default function StudentDashboardPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
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
        <Badge color="violet">{t.studentHome.badge}</Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">{t.studentHome.title}</h1>
        <p className="text-sm font-semibold text-ink-soft">{t.studentHome.subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {quickLinkIcons.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="flex h-full flex-col gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${link.color} text-white shadow-sm`}>
                <link.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-ink">{t.studentHome.quickLinks[link.id].label}</p>
                <p className="text-xs font-semibold text-ink-soft">{t.studentHome.quickLinks[link.id].desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-xl font-extrabold text-ink">{t.studentHome.chooseSubject}</h2>
        {loading ? (
          <p className="text-sm font-semibold text-ink-soft">{t.studentHome.loadingSubjects}</p>
        ) : subjects.length === 0 ? (
          <Card className="p-6 text-sm font-semibold text-ink-soft">{t.studentHome.noSubjects}</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.map((subject, i) => {
              const Icon = getSubjectIcon(subject.name);
              const color = subjectColors[i % subjectColors.length];
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSelectSubject(subject)}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-3.5 text-left text-white shadow-pop transition hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="pointer-events-none absolute -right-4 -top-6 h-16 w-16 rounded-full bg-white/15 blur-xl transition group-hover:bg-white/25" />

                  <div className="relative flex items-start justify-between">
                    {subject.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={subject.image}
                        alt={subject.name ?? "Subject image"}
                        className="h-9 w-9 rounded-xl border-2 border-white/40 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-sm backdrop-blur-sm">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide backdrop-blur-sm">
                      {subject.code || "SUB"}
                    </span>
                  </div>

                  <div className="relative mt-2.5 space-y-0.5">
                    <p className="font-heading text-sm font-extrabold leading-tight">{subject.name || `Subject ${subject.id}`}</p>
                    <p className="text-[10px] font-bold text-white/80">{t.studentHome.tapToStart}</p>
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
