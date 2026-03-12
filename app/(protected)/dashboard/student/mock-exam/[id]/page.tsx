"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type ExamRow = {
  id: number;
  created_at: string | null;
  title: string | null;
  max_score: number | null;
  subject_id: number | null;
  description: string | null;
  start_date: string | null;
  duration: number | null;
};

type ExamQuestion = {
  id: number;
  exam_id: number | null;
  subject_id: number | null;
  sort: number | null;
  question: string | null;
  type: string | null;
  mcq1: string | null;
  mcq2: string | null;
  mcq3: string | null;
  mcq4: string | null;
  answer: string | null;
};

export default function StudentMockExamDetailPage() {
  const params = useParams();
  const examId = Number(params?.id);
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const [exam, setExam] = useState<ExamRow | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [submittedPercent, setSubmittedPercent] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      const [{ data: examData, error: examError }, { data: questionData, error: questionError }] = await Promise.all([
        supabase
          .from("exam")
          .select("id, created_at, title, max_score, subject_id, description, start_date, duration")
          .eq("id", examId)
          .maybeSingle(),
        supabase
          .from("exam_questions")
          .select("id, exam_id, subject_id, sort, question, type, mcq1, mcq2, mcq3, mcq4, answer")
          .eq("exam_id", examId)
          .order("sort", { ascending: true })
          .order("id", { ascending: true }),
      ]);

      if (!isMounted) return;

      if (examError || questionError || !examData) {
        setError(examError?.message ?? questionError?.message ?? "Exam not found.");
        setLoading(false);
        return;
      }

      const questionRows = (questionData as ExamQuestion[]) ?? [];
      setExam(examData as ExamRow);
      setQuestions(questionRows);

      if (questionRows.length > 0) {
        const questionIds = questionRows.map((q) => q.id);
        const { data: answerData, error: answerError } = await supabase
          .from("student_exam_answer")
          .select("question_id, answer")
          .eq("student_id", session.user.id)
          .in("question_id", questionIds);

        if (!isMounted) return;

        if (answerError) {
          setError(answerError.message ?? "Unable to load answers.");
          setLoading(false);
          return;
        }

        const answerMap = (answerData ?? []).reduce<Record<number, string>>((acc, row) => {
          if (row.question_id !== null && row.answer !== null) {
            acc[Number(row.question_id)] = row.answer;
          }
          return acc;
        }, {});
        setAnswers(answerMap);
      }

      const { data: scoreRow } = await supabase
        .from("exam_students")
        .select("score, percentage, is_submit")
        .eq("exam_id", examId)
        .eq("student_id", session.user.id)
        .maybeSingle();
      if (scoreRow?.score !== undefined) {
        setSubmittedScore(scoreRow.score);
        setSubmittedPercent(scoreRow.percentage ?? null);
        setIsSubmitted(Boolean(scoreRow.is_submit));
        if (scoreRow.is_submit) {
          setLocked(true);
        }
      }

      setLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [examId, session, supabase]);

  useEffect(() => {
    if (!exam || !session) return;
    const startTime = exam.start_date ? new Date(exam.start_date).getTime() : Date.now();
    const durationMs = (exam.duration ?? 0) * 60_000;
    const key = `exam_end_${exam.id}_${session.user.id}`;
    const storedEnd = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const defaultEnd = startTime + durationMs;
    const storedMs = storedEnd ? new Date(storedEnd).getTime() : null;
    const endTime = storedMs && storedMs > defaultEnd ? storedMs : defaultEnd;

    if (typeof window !== "undefined" && (!storedEnd || storedMs !== endTime)) {
      localStorage.setItem(key, new Date(endTime).toISOString());
    }

    const tick = () => {
      const current = Date.now();
      if (current < startTime) {
        setLocked(true);
        setRemainingMs(endTime - current);
        return;
      }

      const remaining = endTime - current;
      const clamped = Math.max(0, remaining);
      setRemainingMs(clamped);
      setLocked(clamped <= 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [exam, session]);

  const timeDisplay = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingMs]);

  const handleAnswerSelect = async (questionId: number, value: string, type?: string | null) => {
    if (!session || locked || isSubmitted) return;
    const storeValue = type === "mcq" ? value : value;
    setAnswers((prev) => ({ ...prev, [questionId]: storeValue }));
    setSavingAnswer(true);
    const { data: existing } = await supabase
      .from("student_exam_answer")
      .select("id")
      .eq("question_id", questionId)
      .eq("student_id", session.user.id)
      .maybeSingle();

    let saveError: { message?: string } | null = null;

    if (existing?.id) {
      const { error } = await supabase.from("student_exam_answer").update({ answer: storeValue }).eq("id", existing.id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from("student_exam_answer")
        .insert({
          id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${questionId}-${session.user.id}`,
          question_id: questionId,
          student_id: session.user.id,
          answer: storeValue,
        });
      saveError = error;
    }

    if (saveError) {
      setError(saveError.message ?? "Unable to save answer.");
    }
    setSavingAnswer(false);
  };

  const handleSubmit = async () => {
    if (!exam || !session || isSubmitted) {
      setError(isSubmitted ? "Exam already submitted." : null);
      return;
    }
    setSubmitting(true);
    setError(null);

    const totalCorrect = questions.reduce((score, q) => {
      const userAnswer = (answers[q.id] ?? "").trim().toLowerCase();
      const expected = (q.answer ?? "").trim().toLowerCase();
      if (userAnswer && expected && userAnswer === expected) {
        return score + 1;
      }
      return score;
    }, 0);
    const percent = exam.max_score && exam.max_score > 0 ? Math.round((totalCorrect / exam.max_score) * 100) : null;

    const { data: existing } = await supabase
      .from("exam_students")
      .select("id, is_submit")
      .eq("exam_id", exam.id)
      .eq("student_id", session.user.id)
      .maybeSingle();

    let submitError: { message?: string } | null = null;

    if (existing?.id) {
      if (existing.is_submit) {
        submitError = { message: "Exam already submitted." };
      } else {
        const { error } = await supabase
          .from("exam_students")
          .update({ score: totalCorrect, percentage: percent, is_submit: true })
          .eq("id", existing.id);
        submitError = error;
      }
    } else {
      const { error } = await supabase
        .from("exam_students")
        .insert({
          id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${exam.id}-${session.user.id}`,
          exam_id: exam.id,
          student_id: session.user.id,
          score: totalCorrect,
          percentage: percent,
          is_submit: true,
        });
      submitError = error;
    }

    if (submitError) {
      setError(submitError.message ?? "Unable to submit exam.");
      setSubmitting(false);
      return;
    }

    setSubmittedScore(totalCorrect);
    setSubmittedPercent(percent);
    setIsSubmitted(true);
    setLocked(true);
    setSubmitting(false);
    router.push("/dashboard/student/mock-exam");
  };

  if (!session) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Mock exam</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Please sign in to take this exam.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
        Loading exam...
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="space-y-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => router.push("/dashboard/student/mock-exam")}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
        >
          Back to exams
        </button>
      </div>
    );
  }

  const startsAt = exam.start_date ? new Date(exam.start_date) : null;
  const startLocked = startsAt ? startsAt.getTime() > Date.now() : false;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Mock exam</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">{exam.title ?? `Exam ${exam.id}`}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {startsAt ? `Starts ${startsAt.toLocaleString()}` : "No start time"} · {exam.duration ?? 0} minutes · Max {exam.max_score ?? 0}
          </p>
          {exam.description ? <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{exam.description}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-sm font-semibold ${locked || startLocked || isSubmitted ? "text-amber-600" : "text-emerald-600"}`}>
            {locked || startLocked || isSubmitted ? "Locked" : "Active"}
          </span>
          <div className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-mono text-white shadow-md">{timeDisplay}</div>
          {submittedScore !== null ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Submitted score: {submittedScore}
              {submittedPercent !== null ? ` (${submittedPercent}%)` : ""}
            </div>
          ) : null}
          {isSubmitted ? <div className="text-xs text-gray-500 dark:text-gray-400">Submission locked</div> : null}
        </div>
      </div>

      {startLocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
          This exam is not open yet. Please return at the start time.
        </div>
      ) : null}

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
            No questions for this exam yet.
          </div>
        ) : (
          questions.map((q, index) => {
            const choices = [q.mcq1, q.mcq2, q.mcq3, q.mcq4].filter(Boolean) as string[];
            const selected = answers[q.id];
            return (
              <div key={q.id} className="space-y-2 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                      <span>Question {index + 1}</span>
                      {q.type ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">{q.type}</span> : null}
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-900 dark:prose-invert" dangerouslySetInnerHTML={{ __html: q.question ?? "" }} />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {choices.map((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selected === letter;
                    return (
                      <button
                        key={`${q.id}-choice-${idx}`}
                        type="button"
                        disabled={locked}
                        onClick={() => void handleAnswerSelect(q.id, letter, q.type)}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500/80 dark:bg-blue-900/40 dark:text-blue-50"
                            : "border-gray-200 hover:border-blue-200 dark:border-gray-800 dark:hover:border-blue-500/40"
                        } ${locked ? "opacity-50" : ""}`}
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
                          {letter}
                        </span>
                        <span className="leading-snug text-gray-900 dark:text-gray-100">{choice}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/student/mock-exam")}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
        >
          Back to exams
        </button>
        <button
          type="button"
          disabled={locked || submitting || questions.length === 0 || isSubmitted}
          onClick={() => void handleSubmit()}
          className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
            locked || submitting || questions.length === 0 || isSubmitted
              ? "border border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-400"
              : "bg-emerald-600 text-white hover:-translate-y-0.5 hover:shadow-md"
          }`}
        >
          {submitting ? "Submitting..." : isSubmitted ? "Submitted" : submittedScore !== null ? "Re-submit score" : "Submit exam"}
        </button>
        {savingAnswer ? <span className="text-xs text-gray-500 dark:text-gray-400">Saving...</span> : null}
      </div>
    </div>
  );
}
