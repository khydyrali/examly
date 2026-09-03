"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ClipboardList, FileQuestion, Menu, Target, X } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Mode = "mcq" | "frq";
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

type ParentRow = {
  id: number;
  question: string | null;
  num: string | null;
  year: string | null;
  season_id: number | null;
  paper: string | null;
  chapter_id: number | null;
  mark_scheme: string | null;
  max_score: number | null;
};

type ChildRow = {
  id: number;
  parent_id: number | null;
  question: string | null;
  mark_scheme: string | null;
  max_score: number | null;
};

type GradeResult = {
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
};

type GradingState = {
  loading: boolean;
  error: string | null;
  result: GradeResult | null;
};

function stripHtml(html: string | null): string {
  if (!html) return "";
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ").trim();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim();
}

function HtmlBlock({ html }: { html: string | null }) {
  if (!html) return <p className="text-sm font-semibold text-ink-soft">No content provided.</p>;
  return (
    <>
      <div className="practice-html max-w-none [&_*]:break-words" dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
      <style jsx global>{`
        .practice-html {
          font-size: 15px;
          line-height: 1.7;
        }
        .practice-html h1,
        .practice-html h2,
        .practice-html h3,
        .practice-html h4,
        .practice-html h5,
        .practice-html h6 {
          font-weight: 700;
          margin: 1.1em 0 0.5em;
        }
        .practice-html p {
          margin: 0 0 0.75em;
        }
        .practice-html ul,
        .practice-html ol {
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0 0 0.85em !important;
        }
        .practice-html ul {
          list-style-type: disc !important;
        }
        .practice-html ol {
          list-style-type: decimal !important;
        }
        .practice-html li {
          display: list-item !important;
          margin: 0.25em 0;
        }
        .practice-html blockquote {
          border-left: 3px solid #e9d5ff;
          padding-left: 0.75rem;
          color: var(--color-ink-soft);
          margin: 0 0 0.75em;
        }
        .practice-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
        }
        .practice-html th,
        .practice-html td {
          border: 1px solid #e9d5ff;
          padding: 0.5rem 0.75rem;
        }
        .practice-html img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .practice-html code {
          background: #f4f1ff;
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
        }
      `}</style>
    </>
  );
}

const MARKING_MESSAGES = [
  "Reading your answer...",
  "Comparing against the mark scheme...",
  "Checking for key terms and evidence...",
  "Weighing strengths and improvements...",
  "Making sure you get the best feedback...",
  "Polishing your feedback...",
];

function MarkingLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MARKING_MESSAGES.length);
    }, 1800);
    const tokenTimer = setInterval(() => {
      setTokens((t) => {
        if (t >= 4200) return t;
        const step = t < 600 ? 41 : t < 1800 ? 23 : t < 3200 ? 11 : 3;
        return Math.min(t + step, 4200);
      });
    }, 120);
    return () => {
      clearInterval(messageTimer);
      clearInterval(tokenTimer);
    };
  }, []);

  return (
    <div className="mt-3 space-y-2 rounded-2xl border-2 border-violet-200 bg-violet-50 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
        </span>
        <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700">{MARKING_MESSAGES[messageIndex]}</p>
      </div>
      <p className="text-[11px] font-semibold text-violet-500">~{tokens.toLocaleString()} tokens analyzed</p>
    </div>
  );
}

function GradeResultCard({ result }: { result: GradeResult }) {
  return (
    <div className="mt-3 space-y-2 rounded-2xl border-2 border-violet-200 bg-violet-50 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700">AI marking result</p>
        <Badge color="teal">
          {result.marksAwarded} / {result.maxMarks} marks
        </Badge>
      </div>
      {result.feedback ? <p className="text-sm text-ink">{result.feedback}</p> : null}
      {result.strengths?.length ? (
        <div>
          <p className="text-xs font-bold text-emerald-700">Strengths</p>
          <ul className="ml-4 list-disc text-sm text-ink">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.improvements?.length ? (
        <div>
          <p className="text-xs font-bold text-amber-700">Improvements</p>
          <ul className="ml-4 list-disc text-sm text-ink">
            {result.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ChapterList({
  chapterTree,
  openParents,
  activeChapterId,
  onToggleParent,
  onSelectChild,
}: {
  chapterTree: ChapterNode[];
  openParents: Record<number, boolean>;
  activeChapterId: number | null;
  onToggleParent: (id: number) => void;
  onSelectChild: (id: number) => void;
}) {
  if (chapterTree.length === 0) {
    return <p className="px-1 text-sm font-semibold text-ink-soft">No chapters found for this subject yet.</p>;
  }
  return (
    <div className="space-y-2.5">
      {chapterTree.map((parent) => {
        const isOpen = openParents[parent.id];
        const isActive = activeChapterId === parent.id;
        return (
          <div key={parent.id} className="overflow-hidden rounded-2xl border-2 border-subtle bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => onToggleParent(parent.id)}
              className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm font-bold transition ${
                isActive ? "bg-subtle text-violet-700" : "bg-surface text-ink hover:bg-subtle/60"
              }`}
            >
              <div className="flex flex-col">
                <span className="line-clamp-1">{parent.title}</span>
                <span className="text-[11px] font-semibold text-ink-soft">{parent.children.length} topics</span>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            <div
              className={`${isOpen ? "max-h-[1200px]" : "max-h-0"} space-y-1 overflow-hidden border-t-2 border-subtle bg-subtle/40 px-2 py-2 transition-[max-height] duration-300`}
            >
              {parent.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onSelectChild(child.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm leading-tight font-semibold transition ${
                    activeChapterId === child.id ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm" : "text-ink hover:bg-surface"
                  }`}
                >
                  <span className="line-clamp-1">{child.title}</span>
                  <span className={`text-[11px] font-bold ${activeChapterId === child.id ? "text-white/80" : "text-ink-soft"}`}>Open</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PracticePageInner() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "frq" ? "frq" : "mcq");

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [showChapterModal, setShowChapterModal] = useState(false);

  // MCQ-only state
  const [mcqOpenParents, setMcqOpenParents] = useState<Record<number, boolean>>({});
  const [mcqActiveChapterId, setMcqActiveChapterId] = useState<number | null>(null);
  const [mcqChapterFilter, setMcqChapterFilter] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [recordedQuizIds, setRecordedQuizIds] = useState<Set<number>>(new Set());

  // FRQ-only state
  const [frqOpenParents, setFrqOpenParents] = useState<Record<number, boolean>>({});
  const [frqActiveChapterId, setFrqActiveChapterId] = useState<number | null>(null);
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [childrenMap, setChildrenMap] = useState<Map<number, ChildRow[]>>(new Map());
  const [activeParentIndex, setActiveParentIndex] = useState(0);
  const [frqLoading, setFrqLoading] = useState(false);
  const [frqError, setFrqError] = useState<string | null>(null);
  const [openMarkSchemes, setOpenMarkSchemes] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gradingState, setGradingState] = useState<Record<string, GradingState>>({});

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
        if (typeof window !== "undefined") localStorage.setItem("subject_label", label);
      }
      setSubjectsLoaded(true);
    };
    void loadSubjects();
  }, [selectedSubject, supabase]);

  // Shared chapter tree, independent active-selection per mode.
  useEffect(() => {
    if (!selectedSubject) return;
    let isMounted = true;
    const loadChapters = async () => {
      const { data } = await supabase
        .from("chapter")
        .select("id, title, parent_id, sort, subject_id")
        .eq("subject_id", Number(selectedSubject))
        .order("parent_id", { ascending: true })
        .order("sort", { ascending: true })
        .order("title", { ascending: true });
      if (!isMounted) return;
      const rows = (data as ChapterRow[]) ?? [];
      setChapters(rows);

      const seedOpen = (prev: Record<number, boolean>) => {
        const next = { ...prev };
        rows
          .filter((c) => !c.parent_id)
          .forEach((parent, index) => {
            if (next[parent.id] === undefined) next[parent.id] = index === 0;
          });
        return next;
      };
      setMcqOpenParents(seedOpen);
      setFrqOpenParents(seedOpen);

      setMcqActiveChapterId((prev) => (prev && rows.some((c) => c.id === prev) ? prev : null));
      setMcqChapterFilter((prev) => (prev && rows.some((c) => c.id === prev) ? prev : null));

      setFrqActiveChapterId((prev) => {
        if (prev && rows.some((c) => c.id === prev)) return prev;
        const firstParent = rows.find((c) => !c.parent_id);
        return firstParent ? firstParent.id : null;
      });
    };
    void loadChapters();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  useEffect(() => {
    if (!selectedSubject) return;
    let isMounted = true;
    const loadQuizzes = async () => {
      setQuizLoading(true);
      setQuizError(null);
      setSelectedChoice(null);
      const { data, error } = await supabase
        .from("quiz")
        .select("id, chapter_id, subject_id, question, mcq1, mcq2, mcq3, mcq4, mcq_answer, mark_scheme, num, year, season_id, paper")
        .eq("subject_id", Number(selectedSubject))
        .order("chapter_id", { ascending: true })
        .order("num", { ascending: true })
        .order("id", { ascending: true });
      if (!isMounted) return;
      if (error) setQuizError(error.message);
      setQuizzes((data as QuizRow[]) ?? []);
      setQuizLoading(false);
    };
    void loadQuizzes();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setShowAnswer(false);
  }, [mcqChapterFilter, quizzes]);

  useEffect(() => {
    const fetchFrq = async () => {
      if (!selectedSubject) return;
      setFrqLoading(true);
      setFrqError(null);
      setOpenMarkSchemes(new Set());

      let parentQuery = supabase
        .from("quiz_frq")
        .select("id, question, num, year, season_id, paper, chapter_id, mark_scheme, max_score, parent_id")
        .eq("subject_id", Number(selectedSubject))
        .is("parent_id", null)
        .order("id", { ascending: true });
      if (frqActiveChapterId) parentQuery = parentQuery.eq("chapter_id", frqActiveChapterId);

      const { data: parentData, error: parentError } = await parentQuery;
      if (parentError) {
        setFrqError(parentError.message);
        setFrqLoading(false);
        return;
      }
      const parentRows = (parentData as ParentRow[]) ?? [];
      setParents(parentRows);

      const parentIds = parentRows.map((p) => p.id);
      if (parentIds.length === 0) {
        setChildrenMap(new Map());
        setFrqLoading(false);
        return;
      }
      const { data: childData, error: childError } = await supabase
        .from("quiz_frq")
        .select("id, parent_id, question, mark_scheme, max_score")
        .in("parent_id", parentIds)
        .order("id", { ascending: true });
      if (childError) {
        setFrqError(childError.message);
        setFrqLoading(false);
        return;
      }
      const map = new Map<number, ChildRow[]>();
      (childData as ChildRow[]).forEach((row) => {
        if (!row.parent_id) return;
        const list = map.get(row.parent_id) ?? [];
        list.push(row);
        map.set(row.parent_id, list);
      });
      setChildrenMap(map);
      setActiveParentIndex(0);
      setFrqLoading(false);
    };
    void fetchFrq();
  }, [frqActiveChapterId, selectedSubject, supabase]);

  useEffect(() => {
    setActiveParentIndex((idx) => (parents.length === 0 ? 0 : Math.min(idx, parents.length - 1)));
  }, [parents]);

  const chapterTree = useMemo<ChapterNode[]>(() => {
    const sorted = [...chapters].sort((a, b) => {
      const sortA = a.sort ?? 0;
      const sortB = b.sort ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return (a.title ?? "").localeCompare(b.title ?? "");
    });
    const parentRows = sorted.filter((c) => !c.parent_id);
    const childrenByParent = sorted
      .filter((c) => !!c.parent_id)
      .reduce<Record<number, ChapterRow[]>>((acc, child) => {
        const key = child.parent_id as number;
        acc[key] = acc[key] ? [...acc[key], child] : [child];
        return acc;
      }, {});
    return parentRows.map((parent) => ({
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
    if (mcqChapterFilter === null) return null;
    const selected = chapters.find((c) => c.id === mcqChapterFilter);
    if (!selected) return [mcqChapterFilter];
    if (!selected.parent_id) {
      const childIds = chapters.filter((c) => c.parent_id === mcqChapterFilter).map((c) => c.id);
      return [mcqChapterFilter, ...childIds];
    }
    return [mcqChapterFilter];
  }, [mcqChapterFilter, chapters]);

  const filteredQuizzes = useMemo(() => {
    if (!chapterFilterIds || chapterFilterIds.length === 0) return quizzes;
    return quizzes.filter((q) => (q.chapter_id ? chapterFilterIds.includes(q.chapter_id) : false));
  }, [chapterFilterIds, quizzes]);

  const currentQuiz = filteredQuizzes[currentIndex];
  const subjectLabel = selectedSubjectName || (selectedSubject && !subjectsLoaded ? "Loading subject..." : selectedSubject ? "Subject" : "");

  const mcqActiveTitle = useMemo(() => {
    if (!mcqActiveChapterId) return "All chapters";
    return chapters.find((c) => c.id === mcqActiveChapterId)?.title ?? "Selected chapter";
  }, [mcqActiveChapterId, chapters]);

  const frqActiveTitle = useMemo(() => {
    if (!frqActiveChapterId) return "All chapters";
    return chapters.find((c) => c.id === frqActiveChapterId)?.title ?? "Selected chapter";
  }, [frqActiveChapterId, chapters]);

  const mcqToggleParent = (id: number) => {
    setMcqOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
    setMcqActiveChapterId(id);
    setMcqChapterFilter(id);
  };
  const mcqSelectChild = (id: number) => {
    setMcqActiveChapterId(id);
    setMcqChapterFilter(id);
  };
  const frqToggleParent = (id: number) => {
    setFrqOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
    setFrqActiveChapterId(id);
  };
  const frqSelectChild = (id: number) => {
    setFrqActiveChapterId(id);
  };

  const answerOptions = currentQuiz
    ? [
        { label: "A", value: currentQuiz.mcq1 },
        { label: "B", value: currentQuiz.mcq2 },
        { label: "C", value: currentQuiz.mcq3 },
        { label: "D", value: currentQuiz.mcq4 },
      ]
    : [];

  const handleSelectChoice = (label: string) => {
    setSelectedChoice(label);
    if (!session || !currentQuiz || recordedQuizIds.has(currentQuiz.id)) return;
    setRecordedQuizIds((prev) => new Set(prev).add(currentQuiz.id));
    const isCorrect = currentQuiz.mcq_answer?.trim().toUpperCase() === label;
    void supabase.from("student_quiz_attempt").insert({ student_id: session.user.id, quiz_id: currentQuiz.id, is_correct: isCorrect });
    void supabase
      .from("student_activity_log")
      .upsert({ student_id: session.user.id, activity_date: new Date().toISOString().slice(0, 10) }, { onConflict: "student_id,activity_date" });
  };

  const toggleMarkScheme = (id: number) => {
    setOpenMarkSchemes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const handleAnswerChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleMarkAnswer = async (key: string, question: string | null, markScheme: string | null, maxMarks: number | null) => {
    const studentAnswer = (answers[key] ?? "").trim();
    if (!studentAnswer) {
      setGradingState((prev) => ({ ...prev, [key]: { loading: false, error: "Write an answer before requesting AI marking.", result: null } }));
      return;
    }
    setGradingState((prev) => ({ ...prev, [key]: { loading: true, error: null, result: null } }));
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          question: stripHtml(question) || undefined,
          markScheme: stripHtml(markScheme),
          studentAnswer,
          maxMarks: maxMarks ?? undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          res.status === 503
            ? "The AI grader is busy right now. Please try again in a moment."
            : res.status === 401
              ? "You need to be signed in to use AI marking."
              : res.status === 502 || res.status === 504
                ? "Grading timed out. Please try again."
                : (data?.error ?? "Something went wrong while grading your answer.");
        setGradingState((prev) => ({ ...prev, [key]: { loading: false, error: message, result: null } }));
        return;
      }
      setGradingState((prev) => ({ ...prev, [key]: { loading: false, error: null, result: data as GradeResult } }));
    } catch {
      setGradingState((prev) => ({ ...prev, [key]: { loading: false, error: "Network error while grading your answer.", result: null } }));
    }
  };

  const handleModeChange = (next: Mode) => {
    setMode(next);
    router.replace(`/dashboard/student/practice?mode=${next}`, { scroll: false });
  };

  const clearActiveChapter = () => {
    if (mode === "mcq") {
      setMcqActiveChapterId(null);
      setMcqChapterFilter(null);
    } else {
      setFrqActiveChapterId(null);
    }
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge color="violet">
            <Target className="h-3.5 w-3.5" /> Practice
          </Badge>
          <h1 className="font-heading text-3xl font-extrabold text-ink">Select a subject to start practicing</h1>
          <p className="text-sm font-semibold text-ink-soft">Choose a subject below, then pick MCQ or AI Marking practice.</p>
        </div>
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              className="w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm font-semibold text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100 sm:w-72"
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
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Back to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const chapterListProps =
    mode === "mcq"
      ? { openParents: mcqOpenParents, activeChapterId: mcqActiveChapterId, onToggleParent: mcqToggleParent, onSelectChild: mcqSelectChild }
      : { openParents: frqOpenParents, activeChapterId: frqActiveChapterId, onToggleParent: frqToggleParent, onSelectChild: frqSelectChild };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("mcq")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
            mode === "mcq" ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop" : "border-2 border-subtle bg-surface text-ink"
          }`}
        >
          <FileQuestion className="h-4 w-4" /> MCQ Practice
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("frq")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
            mode === "frq" ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop" : "border-2 border-subtle bg-surface text-ink"
          }`}
        >
          <ClipboardList className="h-4 w-4" /> AI Marking
        </button>
      </div>

      {mode === "mcq" && quizError ? <p className="text-sm font-semibold text-rose-600">{quizError}</p> : null}
      {mode === "frq" && frqError ? <p className="text-sm font-semibold text-rose-600">{frqError}</p> : null}

      <button
        type="button"
        onClick={() => setShowChapterModal(true)}
        className="flex items-center gap-2 rounded-full border-2 border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:bg-subtle lg:hidden"
      >
        <Menu className="h-4 w-4" /> Chapters
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside className="hidden min-h-0 w-full flex-shrink-0 flex-col overflow-hidden rounded-3xl border-2 border-subtle bg-surface/95 shadow-sm lg:flex lg:w-[380px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-subtle bg-subtle/60 px-4 py-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Chapters</p>
              <div className="text-sm font-bold text-ink">{subjectLabel || "Select a subject"}</div>
            </div>
            <button
              type="button"
              onClick={clearActiveChapter}
              className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition ${
                (mode === "mcq" ? mcqActiveChapterId : frqActiveChapterId) === null
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop"
                  : "border-2 border-subtle bg-surface text-ink hover:bg-subtle"
              }`}
            >
              All chapters
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <ChapterList chapterTree={chapterTree} {...chapterListProps} />
          </div>
        </aside>

        {mode === "mcq" ? (
          <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border-2 border-subtle bg-surface/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-violet-600">
                  <span>{subjectLabel || "Practice"}</span>
                  <span className="text-violet-300">/</span>
                  <span className="text-ink-soft">{mcqActiveTitle}</span>
                </div>
                <h2 className="font-heading text-2xl font-extrabold text-ink">{mcqActiveTitle}</h2>
                <p className="text-sm font-semibold text-ink-soft">
                  {quizLoading ? "Loading questions..." : `${filteredQuizzes.length} question${filteredQuizzes.length === 1 ? "" : "s"} in view.`}
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
                  className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle disabled:opacity-40"
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
                  className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle disabled:opacity-40"
                >
                  Next
                </button>
                <span className="text-xs font-bold text-ink-soft">
                  {filteredQuizzes.length > 0 ? `Question ${currentIndex + 1} of ${filteredQuizzes.length}` : "No questions"}
                </span>
              </div>
            </div>

            {quizLoading ? (
              <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
                Loading questions...
              </div>
            ) : !currentQuiz ? (
              <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
                No questions for this selection yet.
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Question</p>
                      <h3 className="font-heading text-base font-bold text-ink">
                        {currentQuiz.num ? `Q${currentQuiz.num}` : "Question"}{" "}
                        <span className="text-sm font-semibold text-ink-soft">
                          {currentQuiz.year ? `| ${currentQuiz.year}` : ""} {currentQuiz.paper ? `| Paper ${currentQuiz.paper}` : ""}
                        </span>
                      </h3>
                    </div>
                    {currentQuiz.mcq_answer && showAnswer ? <Badge color="teal">Correct: {currentQuiz.mcq_answer}</Badge> : null}
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
                          onClick={() => handleSelectChoice(opt.label)}
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
                        className="rounded-full border-2 border-subtle px-3 py-1.5 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle"
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
              </div>
            )}
          </section>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border-2 border-subtle bg-surface/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-bold text-ink">
                {subjectLabel} <span className="text-violet-300">/</span> <span className="text-ink-soft">{frqActiveTitle}</span>
              </div>
              <div className="text-xs font-semibold text-ink-soft">
                {frqLoading ? "Loading..." : `${parents.length} parent${parents.length === 1 ? "" : "s"}`}
              </div>
            </div>

            {frqLoading ? (
              <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
                Loading free response questions...
              </div>
            ) : parents.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
                No free response questions for this chapter yet.
              </div>
            ) : (
              (() => {
                const parent = parents[Math.min(activeParentIndex, parents.length - 1)];
                const childRows = parent ? childrenMap.get(parent.id) ?? [] : [];
                const showParentIdx = Math.min(activeParentIndex, parents.length - 1);
                return parent ? (
                  <div className="space-y-4">
                    <Card className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Parent</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
                          {parent.num ? <Badge color="violet">Q{parent.num}</Badge> : null}
                          {parent.year ? <Badge color="violet">Year {parent.year}</Badge> : null}
                          {parent.season_id ? <Badge color="violet">Season {parent.season_id}</Badge> : null}
                          {parent.paper ? <Badge color="violet">Paper {parent.paper}</Badge> : null}
                          {parent.max_score ? <Badge color="teal">Score: {parent.max_score}</Badge> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                        <span>
                          Parent {showParentIdx + 1} / {parents.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveParentIndex((idx) => Math.max(0, idx - 1))}
                            className="rounded-full border-2 border-subtle px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-subtle disabled:opacity-40"
                            disabled={showParentIdx === 0}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveParentIndex((idx) => Math.min(parents.length - 1, idx + 1))}
                            className="rounded-full border-2 border-subtle px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-subtle disabled:opacity-40"
                            disabled={showParentIdx >= parents.length - 1}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5">
                      <HtmlBlock html={parent.question} />
                      {parent.mark_scheme ? (
                        <div className="mt-3">
                          <button type="button" onClick={() => toggleMarkScheme(parent.id)} className="text-xs font-bold text-violet-700 hover:underline">
                            {openMarkSchemes.has(parent.id) ? "Hide mark scheme" : "Show mark scheme"}
                          </button>
                          {openMarkSchemes.has(parent.id) ? (
                            <div className="mt-2 rounded-2xl border-2 border-subtle bg-subtle/50 p-3 text-sm text-ink">
                              <HtmlBlock html={parent.mark_scheme} />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>

                    <div className="space-y-3">
                      {childRows.length === 0 ? (
                        parent.mark_scheme ? (
                          <Card className="p-4">
                            <div className="mt-3">
                              <label className="text-sm font-bold text-ink">Your answer</label>
                              <textarea
                                value={answers[`parent-${parent.id}`] ?? ""}
                                onChange={(e) => handleAnswerChange(`parent-${parent.id}`, e.target.value)}
                                placeholder="Type your response..."
                                className="mt-2 w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
                                rows={3}
                              />
                              <div className="mt-2 flex items-center justify-between gap-3">
                                {gradingState[`parent-${parent.id}`]?.error ? (
                                  <p className="text-xs font-semibold text-rose-600">{gradingState[`parent-${parent.id}`].error}</p>
                                ) : (
                                  <span />
                                )}
                                <button
                                  type="button"
                                  disabled={gradingState[`parent-${parent.id}`]?.loading}
                                  onClick={() => handleMarkAnswer(`parent-${parent.id}`, parent.question, parent.mark_scheme, parent.max_score)}
                                  className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-pop transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {gradingState[`parent-${parent.id}`]?.loading ? "Marking..." : "Mark my answer"}
                                </button>
                              </div>
                              {gradingState[`parent-${parent.id}`]?.result ? (
                                <GradeResultCard result={gradingState[`parent-${parent.id}`].result as GradeResult} />
                              ) : gradingState[`parent-${parent.id}`]?.loading ? (
                                <MarkingLoader />
                              ) : null}
                            </div>
                          </Card>
                        ) : (
                          <p className="text-sm font-semibold text-ink-soft">No child questions for this parent.</p>
                        )
                      ) : (
                        childRows.map((child) => {
                          const key = `child-${child.id}`;
                          return (
                            <Card key={child.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {child.max_score ? <Badge color="teal">Score: {child.max_score}</Badge> : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleMarkScheme(child.id)}
                                  className="text-xs font-bold text-violet-700 hover:underline"
                                >
                                  {openMarkSchemes.has(child.id) ? "Hide mark scheme" : "Show mark scheme"}
                                </button>
                              </div>
                              <div className="mt-2 text-sm text-ink">
                                {child.question ? <HtmlBlock html={child.question} /> : <span>No question text.</span>}
                              </div>
                              {child.mark_scheme && openMarkSchemes.has(child.id) ? (
                                <div className="mt-3 rounded-2xl border-2 border-subtle bg-subtle/50 p-3 text-sm text-ink">
                                  <HtmlBlock html={child.mark_scheme} />
                                </div>
                              ) : null}
                              <div className="mt-3">
                                <label className="text-sm font-bold text-ink">Your answer</label>
                                <textarea
                                  value={answers[key] ?? ""}
                                  onChange={(e) => handleAnswerChange(key, e.target.value)}
                                  placeholder="Type your response..."
                                  className="mt-2 w-full rounded-xl border-2 border-subtle bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
                                  rows={3}
                                />
                                <div className="mt-2 flex items-center justify-between gap-3">
                                  {gradingState[key]?.error ? <p className="text-xs font-semibold text-rose-600">{gradingState[key].error}</p> : <span />}
                                  <button
                                    type="button"
                                    disabled={gradingState[key]?.loading}
                                    onClick={() => handleMarkAnswer(key, child.question, child.mark_scheme, child.max_score)}
                                    className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-pop transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {gradingState[key]?.loading ? "Marking..." : "Mark my answer"}
                                  </button>
                                </div>
                                {gradingState[key]?.result ? (
                                  <GradeResultCard result={gradingState[key].result as GradeResult} />
                                ) : gradingState[key]?.loading ? (
                                  <MarkingLoader />
                                ) : null}
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null;
              })()
            )}
          </div>
        )}
      </div>

      {showChapterModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-violet-950/40 px-4 py-8 backdrop-blur-sm lg:hidden">
          <div className="mt-8 w-full max-w-md rounded-3xl border-2 border-subtle bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Chapters</p>
                <div className="text-sm font-bold text-ink">{subjectLabel || "Select a subject"}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowChapterModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-subtle bg-surface text-ink shadow-sm hover:bg-subtle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[60vh] overflow-y-auto">
              <ChapterList
                chapterTree={chapterTree}
                openParents={chapterListProps.openParents}
                activeChapterId={chapterListProps.activeChapterId}
                onToggleParent={chapterListProps.onToggleParent}
                onSelectChild={(id) => {
                  chapterListProps.onSelectChild(id);
                  setShowChapterModal(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticePageInner />
    </Suspense>
  );
}
