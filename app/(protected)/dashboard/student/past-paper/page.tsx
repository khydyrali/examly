"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Sun,
  Leaf,
  Snowflake,
} from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

type Option = { label: string; value: string };
type QuizRow = {
  id: number;
  subject_id: number | null;
  question: string | null;
  mcq1: string | null;
  mcq2: string | null;
  mcq3: string | null;
  mcq4: string | null;
  mcq_answer: string | null;
  mark_scheme?: string | null;
  num?: string | null;
  year?: string | null;
  season_id?: number | null;
  paper?: string | null;
  season?: { name?: string | null } | null;
};

type LookupRow = { id: number; name: string | null };

const subjectColors = [
  "from-violet-500 to-fuchsia-500",
  "from-orange-500 to-amber-400",
  "from-teal-500 to-emerald-500",
  "from-sky-500 to-violet-500",
  "from-rose-500 to-pink-500",
  "from-lime-500 to-emerald-500",
];

function seasonIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("may") || lower.includes("jun")) return Sun;
  if (lower.includes("oct") || lower.includes("nov")) return Leaf;
  return Snowflake;
}

function seasonSortKey(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("mar")) return 0;
  if (lower.includes("may") || lower.includes("jun")) return 1;
  if (lower.includes("oct") || lower.includes("nov")) return 2;
  return 3;
}

function HtmlBlock({ html }: { html: string | null }) {
  if (!html) return <p className="text-sm font-semibold text-ink-soft">No content provided.</p>;
  return (
    <>
      <div className="quiz-html max-w-none [&_*]:break-words" dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
      <style jsx global>{`
        .quiz-html {
          font-size: 15px;
          line-height: 1.7;
        }
        .quiz-html h1,
        .quiz-html h2,
        .quiz-html h3,
        .quiz-html h4,
        .quiz-html h5,
        .quiz-html h6 {
          font-weight: 700;
          margin: 1.1em 0 0.5em;
        }
        .quiz-html p {
          margin: 0 0 0.75em;
        }
        .quiz-html ul,
        .quiz-html ol {
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0 0 0.85em !important;
        }
        .quiz-html ul {
          list-style-type: disc !important;
        }
        .quiz-html ol {
          list-style-type: decimal !important;
        }
        .quiz-html li {
          display: list-item !important;
          margin: 0.25em 0;
        }
        .quiz-html blockquote {
          border-left: 3px solid #e9d5ff;
          padding-left: 0.75rem;
          color: var(--color-ink-soft);
          margin: 0 0 0.75em;
        }
        .quiz-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
        }
        .quiz-html th,
        .quiz-html td {
          border: 1px solid #e9d5ff;
          padding: 0.5rem 0.75rem;
        }
        .quiz-html img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .quiz-html code {
          background: #f4f1ff;
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
        }
      `}</style>
    </>
  );
}

export default function StudentPastPaperPage() {
  const { supabase } = useSupabase();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");

  const [years, setYears] = useState<Option[]>([]);
  const [seasons, setSeasons] = useState<Option[]>([]);
  const [papers, setPapers] = useState<Option[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedSeasonName, setSelectedSeasonName] = useState<string>("");
  const [selectedPaper, setSelectedPaper] = useState<string>("");

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      const { data } = await supabase.from("subject").select("id, name, code").order("name", { ascending: true });
      setSubjects(
        (data ?? []).map((s) => ({
          label: s.code ? `${s.code} - ${s.name ?? ""}`.trim() : s.name ?? String(s.id),
          value: String(s.id),
        })),
      );
      setSubjectsLoading(false);
    };
    void loadSubjects();
  }, [supabase]);

  useEffect(() => {
    const loadLookups = async () => {
      setLookupsLoading(true);
      const [{ data: yearData }, { data: seasonData }, { data: paperData }] = await Promise.all([
        supabase.from("year").select("id, name"),
        supabase.from("season").select("id, name"),
        supabase.from("paper").select("id, name"),
      ]);

      const yearRows = (yearData as LookupRow[]) ?? [];
      setYears(
        yearRows
          .map((y) => ({ label: y.name ?? String(y.id), value: y.name ?? String(y.id) }))
          .sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true })),
      );

      const seasonRows = (seasonData as LookupRow[]) ?? [];
      setSeasons(
        seasonRows
          .map((s) => ({ label: s.name ?? String(s.id), value: String(s.id) }))
          .sort((a, b) => seasonSortKey(a.label) - seasonSortKey(b.label)),
      );

      const paperRows = (paperData as LookupRow[]) ?? [];
      setPapers(
        paperRows
          .map((p) => ({ label: p.name ?? String(p.id), value: p.name ?? String(p.id) }))
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
      );

      setLookupsLoading(false);
    };
    void loadLookups();
  }, [supabase]);

  useEffect(() => {
    if (!selectedSubject || !selectedYear || !selectedSeason || !selectedPaper) return;
    let isMounted = true;

    const loadQuizzes = async () => {
      setLoading(true);
      setError(null);
      setSelectedChoice(null);
      setShowAnswer(false);

      const { data, error: quizError } = await supabase
        .from("quiz")
        .select("id, subject_id, question, mcq1, mcq2, mcq3, mcq4, mcq_answer, mark_scheme, num, year, season_id, paper, season:season_id(name)")
        .eq("subject_id", Number(selectedSubject))
        .eq("year", selectedYear)
        .eq("season_id", Number(selectedSeason))
        .eq("paper", selectedPaper)
        .order("num", { ascending: true, nullsFirst: true });

      if (!isMounted) return;
      if (quizError) setError(quizError.message);
      setQuizzes((data as QuizRow[]) ?? []);
      setCurrentIndex(0);
      setLoading(false);
    };

    void loadQuizzes();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, selectedYear, selectedSeason, selectedPaper, supabase]);

  const currentQuiz = quizzes[currentIndex];
  const answerOptions = currentQuiz
    ? [
        { label: "A", value: currentQuiz.mcq1 },
        { label: "B", value: currentQuiz.mcq2 },
        { label: "C", value: currentQuiz.mcq3 },
        { label: "D", value: currentQuiz.mcq4 },
      ]
    : [];

  const pickSubject = (value: string, label: string) => {
    setSelectedSubject(value);
    setSelectedSubjectName(label);
    setSelectedYear("");
    setSelectedSeason("");
    setSelectedSeasonName("");
    setSelectedPaper("");
  };

  const crumbs: { label: string; onClick: () => void }[] = [
    { label: "Past Papers", onClick: () => pickSubject("", "") },
  ];
  if (selectedSubject) crumbs.push({ label: selectedSubjectName, onClick: () => { setSelectedYear(""); setSelectedSeason(""); setSelectedPaper(""); } });
  if (selectedYear) crumbs.push({ label: selectedYear, onClick: () => { setSelectedSeason(""); setSelectedPaper(""); } });
  if (selectedSeason) crumbs.push({ label: selectedSeasonName, onClick: () => setSelectedPaper("") });
  if (selectedPaper) crumbs.push({ label: `Paper ${selectedPaper}`, onClick: () => {} });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge color="teal">
          <BookOpen className="h-3.5 w-3.5" /> Past Papers
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Every subject. Every year. Every session.</h1>
        <p className="text-sm font-semibold text-ink-soft">Pick a subject, then drill down to the exact paper you need.</p>
      </div>

      {crumbs.length > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-ink-soft">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-violet-300" /> : null}
              <button
                type="button"
                onClick={c.onClick}
                disabled={i === crumbs.length - 1}
                className={i === crumbs.length - 1 ? "text-violet-700" : "hover:text-violet-700 hover:underline"}
              >
                {c.label}
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {!selectedSubject ? (
        <Card className="p-6">
          <p className="mb-4 text-sm font-bold text-ink-soft">Choose a subject to browse its past papers</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectsLoading ? (
              <p className="text-sm font-semibold text-ink-soft">Loading subjects…</p>
            ) : (
              subjects.map((s, i) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => pickSubject(s.value, s.label)}
                  className="flex items-center gap-3 rounded-2xl border-2 border-subtle bg-surface px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${subjectColors[i % subjectColors.length]} text-white shadow-sm`}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="font-heading text-sm font-bold text-ink">{s.label}</span>
                </button>
              ))
            )}
          </div>
        </Card>
      ) : !selectedYear ? (
        <Card className="p-6">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-soft">
            <Calendar className="h-4 w-4" /> Choose a year for {selectedSubjectName}
          </p>
          {lookupsLoading ? (
            <p className="text-sm font-semibold text-ink-soft">Loading years…</p>
          ) : years.length === 0 ? (
            <p className="text-sm font-semibold text-ink-soft">No years configured yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {years.map((y) => (
                <button
                  key={y.value}
                  type="button"
                  onClick={() => setSelectedYear(y.value)}
                  className="rounded-2xl border-2 border-subtle bg-surface px-5 py-3 font-heading text-lg font-extrabold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-subtle/40"
                >
                  {y.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : !selectedSeason ? (
        <Card className="p-6">
          <p className="mb-4 text-sm font-bold text-ink-soft">Choose a session for {selectedYear}</p>
          <div className="flex flex-wrap gap-3">
            {seasons.map((s) => {
              const Icon = seasonIcon(s.label);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSelectedSeason(s.value);
                    setSelectedSeasonName(s.label);
                  }}
                  className="flex items-center gap-2.5 rounded-2xl border-2 border-subtle bg-surface px-5 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50"
                >
                  <Icon className="h-5 w-5 text-orange-500" />
                  <span className="font-heading font-bold text-ink">{s.label}</span>
                </button>
              );
            })}
          </div>
        </Card>
      ) : !selectedPaper ? (
        <Card className="p-6">
          <p className="mb-4 text-sm font-bold text-ink-soft">Choose a paper for {selectedYear} &middot; {selectedSeasonName}</p>
          <div className="flex flex-wrap gap-3">
            {papers.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSelectedPaper(p.value)}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-subtle bg-surface px-5 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50"
              >
                <FileText className="h-5 w-5 text-teal-600" />
                <span className="font-heading font-bold text-ink">Paper {p.label}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-extrabold text-ink">
                  {selectedSubjectName} &middot; {selectedYear} &middot; {selectedSeasonName} &middot; Paper {selectedPaper}
                </h2>
                <p className="text-sm font-semibold text-ink-soft">
                  {loading ? "Loading questions…" : `${quizzes.length} question${quizzes.length === 1 ? "" : "s"} in this paper.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChoice(null);
                    setShowAnswer(false);
                    setCurrentIndex((idx) => Math.max(0, idx - 1));
                  }}
                  disabled={currentIndex === 0 || quizzes.length === 0}
                  className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle/40 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChoice(null);
                    setShowAnswer(false);
                    setCurrentIndex((idx) => Math.min(quizzes.length - 1, idx + 1));
                  }}
                  disabled={currentIndex >= quizzes.length - 1 || quizzes.length === 0}
                  className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle/40 disabled:opacity-40"
                >
                  Next
                </button>
                <span className="text-xs font-bold text-ink-soft">
                  {quizzes.length > 0 ? `${currentIndex + 1} / ${quizzes.length}` : "No questions"}
                </span>
              </div>
            </div>
          </Card>

          {!loading && quizzes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {quizzes.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setSelectedChoice(null);
                    setShowAnswer(false);
                    setCurrentIndex(i);
                  }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold shadow-sm transition ${
                    i === currentIndex
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-subtle bg-surface text-ink hover:border-violet-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading questions…</Card>
          ) : !currentQuiz ? (
            <Card className="p-6 text-center text-sm font-semibold text-ink-soft">No questions found for this paper yet.</Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Question</p>
                    <h3 className="font-heading text-lg font-bold text-ink">{`Q${currentIndex + 1}`}</h3>
                  </div>
                  {currentQuiz.mcq_answer && showAnswer ? (
                    <Badge color="teal">Correct: {currentQuiz.mcq_answer}</Badge>
                  ) : null}
                </div>
                <div className="mt-3">
                  <HtmlBlock html={currentQuiz.question} />
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">Options</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {answerOptions.map((opt) => {
                    const isSelected = selectedChoice === opt.label;
                    const isCorrect = currentQuiz.mcq_answer?.trim().toUpperCase() === opt.label;
                    const showCorrect = (showAnswer && isCorrect) || (isSelected && isCorrect);
                    const border = isSelected ? (showCorrect ? "border-emerald-400" : "border-amber-400") : "border-subtle";
                    const bg = isSelected ? (showCorrect ? "bg-emerald-50" : "bg-amber-50") : "bg-surface";
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedChoice(opt.label)}
                        className={`flex items-start gap-3 rounded-2xl border-2 px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${border} ${bg}`}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-extrabold text-violet-700">
                          {opt.label}
                        </span>
                        <div className="flex-1 text-sm text-ink">
                          <HtmlBlock html={opt.value} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {currentQuiz.mark_scheme ? (
                <Card className="space-y-3 border-dashed p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">Mark scheme</p>
                    <button
                      type="button"
                      onClick={() => setShowAnswer((prev) => !prev)}
                      className="rounded-full border-2 border-subtle px-3 py-1.5 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle/40"
                    >
                      {showAnswer ? "Hide answer" : "View answer"}
                    </button>
                  </div>
                  {showAnswer ? (
                    <div className="text-sm text-ink">
                      <HtmlBlock html={currentQuiz.mark_scheme} />
                    </div>
                  ) : null}
                </Card>
              ) : null}
            </>
          )}
        </div>
      )}

      {selectedSubject ? (
        <button
          type="button"
          onClick={() => {
            if (selectedPaper) setSelectedPaper("");
            else if (selectedSeason) setSelectedSeason("");
            else if (selectedYear) setSelectedYear("");
            else pickSubject("", "");
          }}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      ) : null}
    </div>
  );
}
