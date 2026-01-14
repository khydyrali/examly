"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
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

type ExamWithScore = ExamRow & { score?: number | null; percentage?: number | null };

export default function StudentMockExamListPage() {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [exams, setExams] = useState<ExamWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!selectedSubject || !session) return;
    let isMounted = true;

    const loadExams = async () => {
      setLoading(true);
      setError(null);
      const subjectId = Number(selectedSubject);

      const [{ data: examsData, error: examsError }, { data: scoreData, error: scoreError }] = await Promise.all([
        supabase
          .from("exam")
          .select("id, created_at, title, max_score, subject_id, description, start_date, duration")
          .eq("subject_id", subjectId)
          .order("start_date", { ascending: false }),
        supabase.from("exam_students").select("exam_id, score, percentage").eq("student_id", session.user.id),
      ]);

      if (!isMounted) return;

      if (examsError || scoreError) {
        setError(examsError?.message ?? scoreError?.message ?? "Unable to load exams.");
        setLoading(false);
        return;
      }

      const scoresByExam = (scoreData ?? []).reduce<Record<number, { score: number | null; percentage: number | null }>>((acc, row) => {
        acc[Number(row.exam_id)] = { score: row.score ?? null, percentage: row.percentage ?? null };
        return acc;
      }, {});

      setExams(
        ((examsData as ExamRow[]) ?? []).map((exam) => {
          const row = scoresByExam[Number(exam.id)];
          const score = row?.score;
          const percentage =
            row?.percentage !== undefined && row?.percentage !== null
              ? row.percentage
              : score !== undefined && score !== null && exam.max_score
                ? Math.round((score / exam.max_score) * 100)
                : null;
          return {
            ...exam,
            score,
            percentage,
          };
        }),
      );
      setLoading(false);
    };

    void loadExams();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, session, supabase]);

  const subjectLabel = useMemo(
    () => selectedSubjectName || (selectedSubject && !subjectsLoaded ? "Loading subject..." : selectedSubject ? "Subject" : ""),
    [selectedSubject, selectedSubjectName, subjectsLoaded],
  );

  const examCounts = useMemo(() => {
    const now = new Date().getTime();
    let open = 0;
    let upcoming = 0;
    let closed = 0;

    exams.forEach((exam) => {
      const startsAt = exam.start_date ? new Date(exam.start_date).getTime() : null;
      const endsAt = startsAt && exam.duration ? startsAt + exam.duration * 60_000 : null;

      if (endsAt && endsAt < now) {
        closed += 1;
      } else if (startsAt && startsAt > now) {
        upcoming += 1;
      } else {
        open += 1;
      }
    });

    return { open, upcoming, closed };
  }, [exams]);

  if (!session) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Mock exams</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Please sign in to view exams.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Mock exams</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Mock exams</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a subject, then begin any available exam at its start time.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-semibold">Subject</span>
          <select
            value={selectedSubject ?? ""}
            onChange={(event) => {
              const value = event.target.value || null;
              setSelectedSubject(value);
              setExams([]);
              setError(null);
              if (value && typeof window !== "undefined") {
                localStorage.setItem("subject_id", value);
              }
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{subjectLabel || "Select a subject"}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading
                ? "Loading exams..."
                : `Open: ${examCounts.open} · Upcoming: ${examCounts.upcoming} · Closed: ${examCounts.closed} · Total: ${exams.length}`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
              Loading exams...
            </div>
          ) : exams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
              No exams yet for this subject.
            </div>
          ) : (
            exams.map((exam) => {
              const startsAt = exam.start_date ? new Date(exam.start_date) : null;
              const now = new Date();
              const endsAt = startsAt && exam.duration ? new Date(startsAt.getTime() + exam.duration * 60_000) : null;
              const isUpcoming = startsAt ? startsAt.getTime() > now.getTime() : false;
              const isClosed = endsAt ? endsAt.getTime() < now.getTime() : false;
              const canStart = !isClosed && !isUpcoming;
              return (
                <div
                  key={exam.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{exam.title ?? `Exam ${exam.id}`}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {startsAt ? startsAt.toLocaleString() : "No start date"} · {exam.duration ?? 0} min
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      <div>Max score: {exam.max_score ?? 0}</div>
                      {exam.score !== undefined ? (
                        <div>
                          Your score: {exam.score ?? 0}
                          {exam.percentage !== null && exam.percentage !== undefined ? ` (${exam.percentage}% )` : ""}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {exam.description ? <p className="text-sm text-gray-700 dark:text-gray-300">{exam.description}</p> : null}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isClosed ? "text-gray-500" : isUpcoming ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {isClosed ? "Closed" : isUpcoming ? "Upcoming" : "Open"}
                    </span>
                    <button
                      type="button"
                      disabled={!canStart}
                      onClick={() => router.push(`/dashboard/student/mock-exam/${exam.id}`)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        canStart
                          ? "bg-blue-600 text-white hover:-translate-y-0.5 hover:shadow-md"
                          : "border border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-400"
                      }`}
                    >
                      {canStart ? (exam.score !== undefined ? "Resume / Review" : "Begin exam") : "Not open yet"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
