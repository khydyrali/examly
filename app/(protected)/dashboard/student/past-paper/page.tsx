"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

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

function HtmlBlock({ html }: { html: string | null }) {
  if (!html) return <p className="text-sm text-gray-600 dark:text-gray-400">No content provided.</p>;
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
        .quiz-html li::marker {
          color: #0f172a;
          font-weight: 600;
        }
        .quiz-html blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 0.75rem;
          color: #4b5563;
          margin: 0 0 0.75em;
        }
        .quiz-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
        }
        .quiz-html th,
        .quiz-html td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
        }
        .quiz-html img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .quiz-html code {
          background: #f3f4f6;
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
        }
        @media (prefers-color-scheme: dark) {
          .quiz-html blockquote {
            border-color: #374151;
            color: #d1d5db;
          }
          .quiz-html th,
          .quiz-html td {
            border-color: #374151;
          }
          .quiz-html code {
            background: #1f2937;
            color: #e5e7eb;
          }
        }
      `}</style>
    </>
  );
}

export default function StudentPastPaperPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [years, setYears] = useState<Option[]>([]);
  const [seasons, setSeasons] = useState<Option[]>([]);
  const [papers, setPapers] = useState<Option[]>([]);

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedPaper, setSelectedPaper] = useState<string>("");

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    const storedLabel = typeof window !== "undefined" ? localStorage.getItem("subject_label") : null;
    if (storedId) {
      setSelectedSubject(storedId);
      if (storedLabel) setSelectedSubjectName(storedLabel);
    }
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      const { data: subjectData } = await supabase.from("subject").select("id, name, code").order("name", { ascending: true });
      setSubjects(
        (subjectData ?? []).map((s) => ({
          label: s.code ? `${s.code} - ${s.name ?? ""}`.trim() : s.name ?? String(s.id),
          value: String(s.id),
        })),
      );
      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        const label = match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id);
        setSelectedSubjectName(label);
        if (typeof window !== "undefined") {
          localStorage.setItem("subject_label", label);
        }
      }
      setSubjectsLoaded(true);
    };
    void loadSubjects();
  }, [selectedSubject, supabase]);

  useEffect(() => {
    if (!selectedSubject) return;
    const loadMeta = async () => {
      const [{ data: yearData }, { data: seasonData }, { data: paperData }] = await Promise.all([
        supabase.from("year").select("id, name").order("name", { ascending: true }),
        supabase.from("season").select("id, name").order("name", { ascending: true }),
        supabase.from("paper").select("id, name").order("name", { ascending: true }),
      ]);
      setYears((yearData ?? []).map((y) => ({ label: y.name ?? String(y.id), value: y.name ?? String(y.id) })));
      setSeasons((seasonData ?? []).map((s) => ({ label: s.name ?? String(s.id), value: String(s.id) })));
      setPapers((paperData ?? []).map((p) => ({ label: p.name ?? String(p.id), value: p.name ?? String(p.id) })));
    };
    void loadMeta();
  }, [selectedSubject, supabase]);

  useEffect(() => {
    if (!selectedSubject) return;
    let isMounted = true;

    const loadQuizzes = async () => {
      setLoading(true);
      setError(null);
      setSelectedChoice(null);

      const subjectId = Number(selectedSubject);
      let query = supabase
        .from("quiz")
        .select("id, subject_id, question, mcq1, mcq2, mcq3, mcq4, mcq_answer, mark_scheme, num, year, season_id, paper, season:season_id(name)")
        .eq("subject_id", subjectId);

      if (selectedYear) query = query.eq("year", selectedYear);
      if (selectedSeason) query = query.eq("season_id", Number(selectedSeason));
      if (selectedPaper) query = query.eq("paper", selectedPaper);

      query = query
        .order("id", { ascending: true })
        .order("year", { ascending: false, nullsFirst: false })
        .order("season_id", { ascending: true, nullsFirst: true })
        .order("paper", { ascending: true, nullsFirst: true })
        .order("num", { ascending: true, nullsFirst: true });

      const { data, error: quizError } = await query;
      if (!isMounted) return;
      if (quizError) {
        setError(quizError.message);
      }
      setQuizzes((data as QuizRow[]) ?? []);
      setCurrentIndex(0);
      setLoading(false);
    };

    void loadQuizzes();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, selectedYear, selectedSeason, selectedPaper, supabase]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setShowAnswer(false);
  }, [selectedYear, selectedSeason, selectedPaper]);

  const currentQuiz = quizzes[currentIndex];

  const answerOptions = currentQuiz
    ? [
        { label: "A", value: currentQuiz.mcq1 },
        { label: "B", value: currentQuiz.mcq2 },
        { label: "C", value: currentQuiz.mcq3 },
        { label: "D", value: currentQuiz.mcq4 },
      ]
    : [];

  const subjectLabel =
    selectedSubjectName || (selectedSubject && !subjectsLoaded ? "Loading subject..." : selectedSubject ? "Subject" : "");

  const metaLabel = useMemo(() => {
    if (!currentQuiz) return "";
    const seasonName = currentQuiz.season?.name ?? currentQuiz.season_id ?? "";
    const parts = [currentQuiz.year, seasonName, currentQuiz.paper ? `Paper ${currentQuiz.paper}` : ""].filter(Boolean);
    return parts.join(" | ");
  }, [currentQuiz]);

  if (!selectedSubject) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Exam Past Paper</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Select a subject to view past papers</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Choose a subject below or go back to the dashboard to pick one.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50 sm:w-72"
              value=""
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                const label = subjects.find((s) => s.value === value)?.label;
                localStorage.setItem("subject_id", value);
                if (label) localStorage.setItem("subject_label", label);
                setSelectedSubject(value);
                if (label) setSelectedSubjectName(label);
              }}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
            >
              <option value="">All</option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">Season</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
            >
              <option value="">All</option>
              {seasons.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">Paper</span>
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
            >
              <option value="">All</option>
              {papers.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <span>{subjectLabel || "Exam Past Paper"}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 dark:text-gray-400">{metaLabel || "All"}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Exam Past Paper</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? "Loading questions..." : `${quizzes.length} question${quizzes.length === 1 ? "" : "s"} in view.`}
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
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
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
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
            >
              Next
            </button>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {quizzes.length > 0 ? `Question ${currentIndex + 1} of ${quizzes.length}` : "No questions"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
            Loading questions...
          </div>
        ) : !currentQuiz ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
            No questions for this selection yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Question</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {currentQuiz.num ? `Q${currentQuiz.num}` : "Question"} {metaLabel ? `| ${metaLabel}` : ""}
                  </h3>
                </div>
                {currentQuiz.mcq_answer && showAnswer ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                    Correct: {currentQuiz.mcq_answer}
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <HtmlBlock html={currentQuiz.question} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Options</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {answerOptions.map((opt) => {
                  const isSelected = selectedChoice === opt.label;
                  const isCorrect = currentQuiz.mcq_answer?.trim().toUpperCase() === opt.label;
                  const highlightSelected = isSelected;
                  const showCorrect = (showAnswer && isCorrect) || (isSelected && isCorrect);
                  const border = highlightSelected
                    ? showCorrect
                      ? "border-emerald-500"
                      : "border-amber-500"
                    : "border-gray-200 dark:border-gray-800";
                  const bg = highlightSelected
                    ? showCorrect
                      ? "bg-emerald-50 dark:bg-emerald-900/30"
                      : "bg-amber-50 dark:bg-amber-900/30"
                    : "bg-white dark:bg-neutral-900";
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedChoice(opt.label)}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${border} ${bg}`}
                    >
                      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
                        {opt.label}
                      </span>
                      <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                        <HtmlBlock html={opt.value} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {currentQuiz.mark_scheme ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Mark scheme</p>
                  <button
                    type="button"
                    onClick={() => setShowAnswer((prev) => !prev)}
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
                  >
                    {showAnswer ? "Hide answer" : "View answer"}
                  </button>
                </div>
                {showAnswer ? (
                  <div className="text-sm text-gray-800 dark:text-gray-100">
                    <HtmlBlock html={currentQuiz.mark_scheme} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
