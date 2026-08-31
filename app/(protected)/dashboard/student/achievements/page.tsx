"use client";

import { useEffect, useState } from "react";
import {
  Award,
  FileQuestion,
  Flame,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Stats = {
  mastered_count: number;
  quiz_correct_count: number;
  exams_submitted_count: number;
  best_exam_percent: number;
  points: number;
  streak_days: number;
};

type ResultRow = { id: string; subject_label: string; grade: string; sort: number };

type Badge_ = {
  key: string;
  title: string;
  desc: string;
  icon: typeof Trophy;
  color: string;
  check: (s: Stats) => boolean;
};

const BADGES: Badge_[] = [
  { key: "streak3", title: "3-Day Streak", desc: "Studied 3 days in a row", icon: Flame, color: "from-orange-400 to-amber-500", check: (s) => s.streak_days >= 3 },
  { key: "streak7", title: "Week Warrior", desc: "7-day study streak", icon: Flame, color: "from-orange-500 to-rose-500", check: (s) => s.streak_days >= 7 },
  { key: "streak30", title: "Unstoppable", desc: "30-day study streak", icon: Flame, color: "from-rose-500 to-purple-600", check: (s) => s.streak_days >= 30 },
  { key: "mastered10", title: "Flashcard Rookie", desc: "Mastered 10 flashcards", icon: Layers, color: "from-violet-500 to-fuchsia-500", check: (s) => s.mastered_count >= 10 },
  { key: "mastered50", title: "Flashcard Pro", desc: "Mastered 50 flashcards", icon: Layers, color: "from-violet-600 to-purple-600", check: (s) => s.mastered_count >= 50 },
  { key: "mastered100", title: "Flashcard Master", desc: "Mastered 100 flashcards", icon: Layers, color: "from-purple-600 to-violet-600", check: (s) => s.mastered_count >= 100 },
  { key: "quiz25", title: "Quiz Whiz", desc: "25 correct quiz answers", icon: FileQuestion, color: "from-sky-500 to-blue-500", check: (s) => s.quiz_correct_count >= 25 },
  { key: "quiz100", title: "Quiz Genius", desc: "100 correct quiz answers", icon: FileQuestion, color: "from-blue-500 to-violet-600", check: (s) => s.quiz_correct_count >= 100 },
  { key: "firstExam", title: "Exam Ready", desc: "Completed your first mock exam", icon: GraduationCap, color: "from-teal-500 to-emerald-500", check: (s) => s.exams_submitted_count >= 1 },
  { key: "examAce", title: "Top Scorer", desc: "Scored 90%+ on a mock exam", icon: Trophy, color: "from-yellow-400 to-amber-500", check: (s) => s.best_exam_percent >= 90 },
  { key: "points500", title: "Rising Star", desc: "Earned 500 study points", icon: Star, color: "from-fuchsia-500 to-pink-500", check: (s) => s.points >= 500 },
  { key: "points1000", title: "Study Legend", desc: "Earned 1,000 study points", icon: Star, color: "from-pink-500 to-rose-600", check: (s) => s.points >= 1000 },
];

export default function AchievementsPage() {
  const { supabase, session } = useSupabase();
  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [subjectLabel, setSubjectLabel] = useState("");
  const [grade, setGrade] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      const [{ data: statsData, error: statsError }, { data: resultData, error: resultError }] = await Promise.all([
        supabase.rpc("get_my_stats").maybeSingle(),
        supabase.from("student_result").select("id, subject_label, grade, sort").eq("student_id", session.user.id).order("sort", { ascending: true }),
      ]);
      if (statsError || resultError) {
        setError(statsError?.message ?? resultError?.message ?? "Unable to load achievements.");
      } else {
        setStats(statsData as Stats);
        setResults((resultData as ResultRow[]) ?? []);
      }
      setLoading(false);
    };
    void load();
  }, [session, supabase]);

  const resetForm = () => {
    setSubjectLabel("");
    setGrade("");
    setEditingId(null);
  };

  const startEdit = (row: ResultRow) => {
    setSubjectLabel(row.subject_label);
    setGrade(row.grade);
    setEditingId(row.id);
  };

  const handleSaveResult = async () => {
    if (!session || !subjectLabel.trim() || !grade.trim()) return;
    setSaving(true);
    setError(null);

    if (editingId) {
      const { error: updateError } = await supabase
        .from("student_result")
        .update({ subject_label: subjectLabel.trim(), grade: grade.trim() })
        .eq("id", editingId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
      setResults((prev) => prev.map((r) => (r.id === editingId ? { ...r, subject_label: subjectLabel.trim(), grade: grade.trim() } : r)));
    } else {
      const { data, error: insertError } = await supabase
        .from("student_result")
        .insert({ student_id: session.user.id, subject_label: subjectLabel.trim(), grade: grade.trim(), sort: results.length })
        .select("id, subject_label, grade, sort")
        .single();
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
      setResults((prev) => [...prev, data as ResultRow]);
    }

    resetForm();
    setSaving(false);
  };

  const handleDeleteResult = async (id: string) => {
    setSaving(true);
    const { error: deleteError } = await supabase.from("student_result").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setResults((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) resetForm();
    }
    setSaving(false);
  };

  if (loading) {
    return <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading your achievements…</Card>;
  }

  const unlockedCount = stats ? BADGES.filter((b) => b.check(stats)).length : 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Badge color="yellow">
          <Award className="h-3.5 w-3.5" /> Achievements
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Your badges &amp; results.</h1>
        <p className="text-sm font-semibold text-ink-soft">
          {stats ? `${unlockedCount} of ${BADGES.length} badges unlocked` : "Keep studying to unlock badges!"}
        </p>
      </div>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
        {BADGES.map((badge) => {
          const unlocked = stats ? badge.check(stats) : false;
          const Icon = badge.icon;
          return (
            <Card
              key={badge.key}
              className={`flex flex-col items-center gap-2 p-4 text-center transition ${unlocked ? "hover:-translate-y-1 hover:shadow-lg" : "opacity-50 grayscale"}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${badge.color} text-white shadow-sm`}>
                <Icon className="h-7 w-7" />
              </div>
              <p className="font-heading text-sm font-bold text-ink">{badge.title}</p>
              <p className="text-xs font-semibold text-ink-soft">{badge.desc}</p>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-extrabold text-ink">My exam results</h2>
          <p className="text-sm font-semibold text-ink-soft">
            Log your real results (IGCSE, IB, A Levels…) to keep track — this is just for you and doesn&apos;t affect the leaderboard.
          </p>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-bold text-ink">Subject / qualification</span>
              <input
                value={subjectLabel}
                onChange={(e) => setSubjectLabel(e.target.value)}
                placeholder="e.g. Math AA HL, IGCSE Physics"
                className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:w-40">
              <span className="font-bold text-ink">Grade</span>
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 7, A*"
                className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <Button onClick={() => void handleSaveResult()} disabled={saving || !subjectLabel.trim() || !grade.trim()}>
              {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Update" : "Add"}
            </Button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="text-sm font-bold text-ink-soft hover:underline">
                Cancel
              </button>
            ) : null}
          </div>

          {results.length > 0 ? (
            <div className="mt-4 divide-y-2 divide-subtle border-t-2 border-subtle">
              {results.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold text-ink">{row.subject_label}</p>
                    <p className="text-sm font-semibold text-violet-600">{row.grade}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-subtle bg-surface text-ink transition hover:bg-subtle/40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteResult(row.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-rose-200 text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-ink-soft">No results added yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
