"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Lightbulb, RotateCcw, Timer, Trophy, XCircle } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

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

function scoreBand(percent: number) {
  if (percent >= 80) {
    return {
      color: "from-emerald-500 to-teal-500",
      badge: "teal" as const,
      label: "Excellent work!",
      tip: "You've clearly mastered this material. Keep your streak going by trying a harder paper or a new topic.",
    };
  }
  if (percent >= 50) {
    return {
      color: "from-amber-400 to-orange-500",
      badge: "yellow" as const,
      label: "Good effort!",
      tip: "You're on the right track. Revisit the questions you missed below, then try a topical quiz on those areas.",
    };
  }
  return {
    color: "from-rose-500 to-orange-500",
    badge: "rose" as const,
    label: "Keep practicing!",
    tip: "This topic needs more review. Go through your notes and flashcards for the questions you missed, then retake a similar quiz.",
  };
}

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

  // Exams are open anytime — the timer is personal: it starts the first time
  // this student opens the exam, not a global exam.start_date window.
  useEffect(() => {
    if (!exam || !session || isSubmitted) return;
    const durationMs = (exam.duration ?? 0) * 60_000;
    if (durationMs <= 0) return;

    const key = `exam_open_${exam.id}_${session.user.id}`;
    const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const openedAt = stored ? new Date(stored).getTime() : Date.now();
    if (typeof window !== "undefined" && !stored) {
      localStorage.setItem(key, new Date(openedAt).toISOString());
    }
    const endTime = openedAt + durationMs;

    const tick = () => {
      const remaining = endTime - Date.now();
      const clamped = Math.max(0, remaining);
      setRemainingMs(clamped);
      setLocked(clamped <= 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [exam, session, isSubmitted]);

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

    void supabase
      .from("student_activity_log")
      .upsert({ student_id: session.user.id, activity_date: new Date().toISOString().slice(0, 10) }, { onConflict: "student_id,activity_date" });

    setSubmittedScore(totalCorrect);
    setSubmittedPercent(percent);
    setIsSubmitted(true);
    setLocked(true);
    setSubmitting(false);
  };

  const handleRetake = async () => {
    if (!exam || !session) return;
    setSubmitting(true);
    setError(null);

    const questionIds = questions.map((q) => q.id);
    if (questionIds.length > 0) {
      const { error: deleteAnswersError } = await supabase
        .from("student_exam_answer")
        .delete()
        .eq("student_id", session.user.id)
        .in("question_id", questionIds);
      if (deleteAnswersError) {
        setError(deleteAnswersError.message ?? "Unable to reset your previous answers.");
        setSubmitting(false);
        return;
      }
    }

    const { error: resetError } = await supabase
      .from("exam_students")
      .update({ score: null, percentage: null, is_submit: false })
      .eq("exam_id", exam.id)
      .eq("student_id", session.user.id);

    if (resetError) {
      setError(resetError.message ?? "Unable to start a new attempt.");
      setSubmitting(false);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(`exam_open_${exam.id}_${session.user.id}`);
    }

    setAnswers({});
    setSubmittedScore(null);
    setSubmittedPercent(null);
    setIsSubmitted(false);
    setLocked(false);
    setRemainingMs(0);
    setSubmitting(false);
  };

  if (!session) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Mock exam</h1>
        <p className="text-sm font-semibold text-ink-soft">Please sign in to take this exam.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
        Loading exam...
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="space-y-3">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => router.push("/dashboard/student/mock-exam")}
          className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:bg-subtle/40"
        >
          Back to exams
        </button>
      </div>
    );
  }

  const band = submittedPercent !== null ? scoreBand(submittedPercent) : null;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge color="rose">Mock exam · Open anytime</Badge>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-ink">{exam.title ?? `Exam ${exam.id}`}</h1>
          <p className="text-sm font-semibold text-ink-soft">
            {exam.duration ?? 0} minute{exam.duration === 1 ? "" : "s"} once you start · Max {exam.max_score ?? 0}
          </p>
          {exam.description ? <p className="mt-1 text-sm font-semibold text-ink-soft">{exam.description}</p> : null}
        </div>
        {!isSubmitted ? (
          <div className="flex flex-col items-end gap-2">
            <Badge color={locked ? "yellow" : "teal"}>{locked ? "Time's up" : "In progress"}</Badge>
            {(exam.duration ?? 0) > 0 ? (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-violet-900 px-3 py-2 font-mono text-sm font-bold text-white shadow-md">
                <Timer className="h-4 w-4" /> {timeDisplay}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isSubmitted && submittedScore !== null ? (
        <Card className={`overflow-hidden bg-gradient-to-br ${band?.color} p-6 text-white`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-white/80">{band?.label}</p>
                <p className="font-heading text-2xl font-extrabold">
                  {submittedScore} / {exam.max_score ?? questions.length}
                  {submittedPercent !== null ? ` (${submittedPercent}%)` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleRetake()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> {submitting ? "Resetting..." : "Retake exam"}
            </button>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/15 p-4 text-sm font-semibold">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{band?.tip}</span>
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
            No questions for this exam yet.
          </div>
        ) : (
          questions.map((q, index) => {
            const choices = [q.mcq1, q.mcq2, q.mcq3, q.mcq4].filter(Boolean) as string[];
            const selected = answers[q.id];
            const correctLetter = (q.answer ?? "").trim().toUpperCase();
            const gotItRight = isSubmitted && selected && selected.trim().toUpperCase() === correctLetter;

            return (
              <Card key={q.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-violet-600">
                      <span>Question {index + 1}</span>
                      {q.type ? <Badge color="violet">{q.type}</Badge> : null}
                    </div>
                    <div className="prose prose-sm max-w-none text-ink" dangerouslySetInnerHTML={{ __html: q.question ?? "" }} />
                  </div>
                  {isSubmitted ? (
                    gotItRight ? (
                      <Badge color="teal">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                      </Badge>
                    ) : (
                      <Badge color="rose">
                        <XCircle className="h-3.5 w-3.5" /> Missed
                      </Badge>
                    )
                  ) : null}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {choices.map((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selected === letter;
                    const isCorrectChoice = isSubmitted && letter === correctLetter;
                    const border = isSubmitted
                      ? isCorrectChoice
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                        : isSelected
                          ? "border-rose-300 bg-rose-50 dark:bg-rose-950/30"
                          : "border-subtle"
                      : isSelected
                        ? "border-violet-400 bg-subtle"
                        : "border-subtle hover:border-violet-300";
                    return (
                      <button
                        key={`${q.id}-choice-${idx}`}
                        type="button"
                        disabled={locked || isSubmitted}
                        onClick={() => void handleAnswerSelect(q.id, letter, q.type)}
                        className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${border} ${
                          locked && !isSubmitted ? "opacity-50" : ""
                        }`}
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700">
                          {letter}
                        </span>
                        <span className="leading-snug text-ink">{choice}</span>
                        {isSubmitted && isCorrectChoice ? <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" /> : null}
                        {isSubmitted && isSelected && !isCorrectChoice ? <XCircle className="ml-auto h-4 w-4 shrink-0 text-rose-500" /> : null}
                      </button>
                    );
                  })}
                </div>
                {isSubmitted && !gotItRight ? (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {selected
                        ? `You picked ${selected}. The correct answer was ${correctLetter || "not set"}.`
                        : `You left this blank. The correct answer was ${correctLetter || "not set"}.`}{" "}
                      Review this topic in your notes or flashcards before retrying similar questions.
                    </span>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/student/mock-exam")}
          className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:bg-subtle/40"
        >
          Back to exams
        </button>
        {!isSubmitted ? (
          <button
            type="button"
            disabled={locked || submitting || questions.length === 0}
            onClick={() => void handleSubmit()}
            className={`rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition ${
              locked || submitting || questions.length === 0
                ? "border-2 border-subtle bg-surface text-ink-soft"
                : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-pop-teal hover:-translate-y-0.5"
            }`}
          >
            {submitting ? "Submitting..." : "Submit exam"}
          </button>
        ) : null}
        {savingAnswer ? <span className="text-xs font-semibold text-ink-soft">Saving...</span> : null}
      </div>
    </div>
  );
}
