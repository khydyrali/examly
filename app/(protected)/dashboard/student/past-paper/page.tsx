"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Calendar, ChevronRight, FileText } from "lucide-react";
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
  image_url?: string | null;
};

type LookupRow = { id: number; name: string | null };
type PaperRow = { id: number; name: string };

const subjectColors = [
  "from-violet-500 to-fuchsia-500",
  "from-orange-500 to-amber-400",
  "from-teal-500 to-emerald-500",
  "from-sky-500 to-violet-500",
  "from-rose-500 to-pink-500",
  "from-lime-500 to-emerald-500",
];

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
          max-width: min(100%, 360px);
          width: 100%;
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
  const [lookupsLoading, setLookupsLoading] = useState(true);

  const [papers, setPapers] = useState<Option[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>("");
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
      const { data: yearData } = await supabase.from("year").select("id, name");

      const yearRows = (yearData as LookupRow[]) ?? [];
      setYears(
        yearRows
          .map((y) => ({ label: y.name ?? String(y.id), value: y.name ?? String(y.id) }))
          .sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true })),
      );

      setLookupsLoading(false);
    };
    void loadLookups();
  }, [supabase]);

  useEffect(() => {
    if (!selectedSubject) {
      setPapers([]);
      return;
    }
    let isMounted = true;
    const loadPapers = async () => {
      setPapersLoading(true);
      const { data } = await supabase.from("subject_paper").select("id, name").eq("subject_id", Number(selectedSubject));
      if (!isMounted) return;
      const paperRows = (data as PaperRow[]) ?? [];
      const uniqueNames = Array.from(new Set(paperRows.map((p) => p.name)));
      setPapers(
        uniqueNames
          .map((name) => ({ label: name, value: name }))
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
      );
      setPapersLoading(false);
    };
    void loadPapers();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  useEffect(() => {
    if (!selectedSubject || !selectedYear || !selectedPaper) return;
    let isMounted = true;

    const loadQuizzes = async () => {
      setLoading(true);
      setError(null);
      setSelectedChoice(null);
      setShowAnswer(false);

      const { data, error: quizError } = await supabase
        .from("quiz")
        .select("id, subject_id, question, mcq1, mcq2, mcq3, mcq4, mcq_answer, mark_scheme, num, year, image_url")
        .eq("subject_id", Number(selectedSubject))
        .eq("type", "mcq")
        .eq("year", selectedYear)
        .eq("paper", selectedPaper);

      if (!isMounted) return;
      if (quizError) setError(quizError.message);
      const rows = (data as QuizRow[]) ?? [];
      rows.sort((a, b) => {
        const numA = Number(a.num);
        const numB = Number(b.num);
        if (Number.isNaN(numA) || Number.isNaN(numB)) return (a.num ?? "").localeCompare(b.num ?? "", undefined, { numeric: true });
        return numA - numB;
      });
      setQuizzes(rows);
      setCurrentIndex(0);
      setLoading(false);
    };

    void loadQuizzes();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, selectedYear, selectedPaper, supabase]);

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
    setSelectedPaper("");
  };

  const crumbs: { label: string; onClick: () => void }[] = [
    { label: "Past Papers", onClick: () => pickSubject("", "") },
  ];
  if (selectedSubject) crumbs.push({ label: selectedSubjectName, onClick: () => { setSelectedYear(""); setSelectedPaper(""); } });
  if (selectedYear) crumbs.push({ label: selectedYear, onClick: () => setSelectedPaper("") });
  if (selectedPaper) crumbs.push({ label: `Paper ${selectedPaper}`, onClick: () => {} });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Badge color="teal">
          <BookOpen className="h-3 w-3" /> Past Papers
        </Badge>
        <h1 className="font-heading text-xl font-extrabold text-ink">Every subject. Every year. Every session.</h1>
        <p className="text-xs font-semibold text-ink-soft">Pick a subject, then drill down to the exact paper you need.</p>
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
      ) : !selectedPaper ? (
        <Card className="p-6">
          <p className="mb-4 text-sm font-bold text-ink-soft">Choose a paper for {selectedYear}</p>
          {papersLoading ? (
            <p className="text-sm font-semibold text-ink-soft">Loading papers…</p>
          ) : papers.length === 0 ? (
            <p className="text-sm font-semibold text-ink-soft">No papers configured for this subject yet.</p>
          ) : (
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
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-sm font-extrabold text-ink">
                  {selectedSubjectName} &middot; {selectedYear} &middot; Paper {selectedPaper}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">
                  {loading ? "Loading questions…" : `${quizzes.length} question${quizzes.length === 1 ? "" : "s"} in this paper.`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChoice(null);
                    setShowAnswer(false);
                    setCurrentIndex((idx) => Math.max(0, idx - 1));
                  }}
                  disabled={currentIndex === 0 || quizzes.length === 0}
                  className="rounded-full border-2 border-subtle bg-surface px-3 py-1 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle/40 disabled:opacity-40"
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
                  className="rounded-full border-2 border-subtle bg-surface px-3 py-1 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle/40 disabled:opacity-40"
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
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quizzes.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setSelectedChoice(null);
                    setShowAnswer(false);
                    setCurrentIndex(i);
                  }}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-extrabold shadow-sm transition ${
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
              {currentQuiz.question ? (
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
              ) : (
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
                    {currentQuiz.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentQuiz.image_url} alt="Question" className="w-full object-contain" />
                    ) : (
                      <p className="text-sm font-semibold text-ink-soft">No content provided.</p>
                    )}
                  </div>
                </Card>
              )}

              <Card className="p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">Options</p>
                {answerOptions.some((opt) => opt.value) ? (
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
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
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
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${border} ${bg} text-violet-700`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
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
