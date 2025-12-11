"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };
type ChapterNode = { id: number; title: string; children: ChapterNode[] };
type QuizRow = {
  id: number;
  chapter_id: number | null;
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

export default function StudentQuizPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({});
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [chapterFilter, setChapterFilter] = useState<number | null>(null);

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    const storedLabel = typeof window !== "undefined" ? localStorage.getItem("subject_label") : null;
    if (storedId) {
      setSelectedSubject(storedId);
      if (storedLabel) {
        setSelectedSubjectName(storedLabel);
      }
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
  }, [selectedSubject, supabase, chapterFilter]);

  useEffect(() => {
    if (!selectedSubject) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSelectedChoice(null);
      const subjectId = Number(selectedSubject);

      const [{ data: chapterData, error: chapterError }, { data: quizData, error: quizError }] = await Promise.all([
        supabase
          .from("chapter")
          .select("id, title, parent_id, sort, subject_id")
          .eq("subject_id", subjectId)
          .order("parent_id", { ascending: true })
          .order("sort", { ascending: true })
          .order("title", { ascending: true }),
        (() => {
          let query = supabase
            .from("quiz")
            .select("id, chapter_id, subject_id, question, mcq1, mcq2, mcq3, mcq4, mcq_answer, mark_scheme, num, year, season_id, paper")
            .eq("subject_id", subjectId)
            .order("chapter_id", { ascending: true })
            .order("num", { ascending: true })
            .order("id", { ascending: true });

          if (chapterFilter !== null) {
            query = query.eq("chapter_id", chapterFilter);
          }

          return query;
        })(),
      ]);

      if (!isMounted) return;

      if (chapterError || quizError) {
        setError(chapterError?.message ?? quizError?.message ?? "Unable to load exam topical questions.");
      }

      setChapters((chapterData as ChapterRow[]) ?? []);
      setQuizzes((quizData as QuizRow[]) ?? []);

      setOpenParents((prev) => {
        const next = { ...prev };
        ((chapterData as ChapterRow[]) ?? [])
          .filter((c) => !c.parent_id)
          .forEach((parent, index) => {
            if (next[parent.id] === undefined) {
              next[parent.id] = index === 0;
            }
          });
        return next;
      });

      setActiveChapterId((prev) => {
        if (!prev) return prev;
        const stillExists = ((chapterData as ChapterRow[]) ?? []).some((c) => c.id === prev);
        return stillExists ? prev : null;
      });

      setLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setShowAnswer(false);
  }, [chapterFilter, quizzes]);

  const chapterTree = useMemo<ChapterNode[]>(() => {
    const sorted = [...chapters].sort((a, b) => {
      const sortA = a.sort ?? 0;
      const sortB = b.sort ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return (a.title ?? "").localeCompare(b.title ?? "");
    });

    const parents = sorted.filter((c) => !c.parent_id);
    const childrenByParent = sorted
      .filter((c) => !!c.parent_id)
      .reduce<Record<number, ChapterRow[]>>((acc, child) => {
        const key = child.parent_id as number;
        acc[key] = acc[key] ? [...acc[key], child] : [child];
        return acc;
      }, {});

    return parents.map((parent) => ({
      id: parent.id,
      title: parent.title ?? `Chapter ${parent.id}`,
      children: (childrenByParent[parent.id] ?? []).map((child) => ({
        id: child.id,
        title: child.title ?? `Chapter ${child.id}`,
        children: [],
      })),
    }));
  }, [chapters]);

  const chapterFilterIds = useMemo(() => {
    if (chapterFilter === null) return null;
    const selected = chapters.find((c) => c.id === chapterFilter);
    if (!selected) return [chapterFilter];
    if (!selected.parent_id) {
      const childIds = chapters.filter((c) => c.parent_id === chapterFilter).map((c) => c.id);
      return [chapterFilter, ...childIds];
    }
    return [chapterFilter];
  }, [chapterFilter, chapters]);

  const filteredQuizzes = useMemo(() => {
    if (!chapterFilterIds || chapterFilterIds.length === 0) return quizzes;
    return quizzes.filter((q) => (q.chapter_id ? chapterFilterIds.includes(q.chapter_id) : false));
  }, [chapterFilterIds, quizzes]);

  const currentQuiz = filteredQuizzes[currentIndex];
  const subjectLabel =
    selectedSubjectName || (selectedSubject && !subjectsLoaded ? "Loading subject..." : selectedSubject ? "Subject" : "");

  const activeChapterTitle = useMemo(() => {
    if (!activeChapterId) return "All chapters";
    const match = chapters.find((c) => c.id === activeChapterId);
    return match?.title ?? "Selected chapter";
  }, [activeChapterId, chapters]);

  const toggleParent = (id: number) => {
    setOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
    setActiveChapterId(id);
    setChapterFilter(id);
  };

  const answerOptions = currentQuiz
    ? [
        { label: "A", value: currentQuiz.mcq1 },
        { label: "B", value: currentQuiz.mcq2 },
        { label: "C", value: currentQuiz.mcq3 },
        { label: "D", value: currentQuiz.mcq4 },
      ]
    : [];

  if (!selectedSubject) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Exam Topical</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Select a subject to view exam topical sets</h1>
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
    <div className="space-y-1">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
        <button
          type="button"
          onClick={() => setShowChapterModal(true)}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100 lg:hidden"
        >
          Chapters
        </button>

        <aside className="sticky top-4 z-20 hidden w-full flex-shrink-0 rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-neutral-900 lg:block lg:w-[360px] max-h-[calc(100vh-32px)] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Chapters</p>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{subjectLabel || "Select a subject"}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveChapterId(null);
                setChapterFilter(null);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition ${
                activeChapterId === null
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              }`}
            >
              All chapters
            </button>
          </div>
          <div className="px-3 pb-4">
            {chapterTree.length === 0 ? (
              <p className="px-1 pt-3 text-sm text-gray-600 dark:text-gray-400">No chapters found for this subject yet.</p>
            ) : null}
            <div className="space-y-3">
              {chapterTree.map((parent) => {
                const isOpen = openParents[parent.id];
                const isActive = activeChapterId === parent.id;
                return (
                  <div key={parent.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900">
                    <button
                      type="button"
                      onClick={() => toggleParent(parent.id)}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
                          : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="line-clamp-1">{parent.title}</span>
                        <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          {parent.children.length} topics
                        </span>
                      </div>
                      <span className={`text-xs transition ${isOpen ? "rotate-90" : ""}`}>&gt;</span>
                    </button>
                    <div
                      className={`${isOpen ? "max-h-[1200px]" : "max-h-0"} space-y-1 overflow-hidden border-t border-gray-200 bg-gray-50 px-2 py-2 transition-[max-height] duration-300 dark:border-gray-800 dark:bg-neutral-950`}
                    >
                      {parent.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setActiveChapterId(child.id);
                            setChapterFilter(child.id);
                          }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left leading-tight transition ${
                          activeChapterId === child.id
                            ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-800 hover:bg-white dark:text-gray-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <span className="line-clamp-1">{child.title}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Open</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-4 rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                <span>{subjectLabel || "Exam Topical"}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 dark:text-gray-400">{activeChapterTitle}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{activeChapterTitle}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? "Loading questions..." : `${filteredQuizzes.length} question${filteredQuizzes.length === 1 ? "" : "s"} in view.`}
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
                disabled={currentIndex === 0 || filteredQuizzes.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChoice(null);
                  setShowAnswer(false);
                  setCurrentIndex((idx) => Math.min(filteredQuizzes.length - 1, idx + 1));
                }}
                disabled={currentIndex >= filteredQuizzes.length - 1 || filteredQuizzes.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Next
              </button>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {filteredQuizzes.length > 0 ? `Question ${currentIndex + 1} of ${filteredQuizzes.length}` : "No questions"}
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
                      {currentQuiz.num ? `Q${currentQuiz.num}` : "Question"}{" "}
                      {currentQuiz.year ? `| ${currentQuiz.year}` : ""} {currentQuiz.paper ? `| Paper ${currentQuiz.paper}` : ""}
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
                        <span
                          className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                        >
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
        </section>
      </div>

      {showChapterModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-8 lg:hidden">
          <div className="mt-8 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-neutral-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Chapters</p>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{subjectLabel || "Select a subject"}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowChapterModal(false)}
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200"
              >
                X
              </button>
            </div>
            <div className="h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {chapterTree.length === 0 ? (
                  <p className="px-1 text-sm text-gray-600 dark:text-gray-400">No chapters found for this subject yet.</p>
                ) : null}
                {chapterTree.map((parent) => {
                  const isOpen = openParents[parent.id];
                  const isActive = activeChapterId === parent.id;
                  return (
                    <div key={parent.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900">
                      <button
                        type="button"
                        onClick={() => toggleParent(parent.id)}
                        className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
                            : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-neutral-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="line-clamp-1">{parent.title}</span>
                          <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                            {parent.children.length} topics
                          </span>
                        </div>
                        <span className={`text-xs transition ${isOpen ? "rotate-90" : ""}`}>&gt;</span>
                      </button>
                      <div
                        className={`${isOpen ? "max-h-[1200px]" : "max-h-0"} space-y-1 overflow-hidden border-t border-gray-200 bg-gray-50 px-2 py-2 transition-[max-height] duration-300 dark:border-gray-800 dark:bg-neutral-950`}
                      >
                        {parent.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              setActiveChapterId(child.id);
                              setChapterFilter(child.id);
                              setShowChapterModal(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left leading-tight transition ${
                              activeChapterId === child.id
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-800 hover:bg-white dark:text-gray-100 dark:hover:bg-neutral-800"
                            }`}
                          >
                            <span className="line-clamp-1">{child.title}</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Open</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
