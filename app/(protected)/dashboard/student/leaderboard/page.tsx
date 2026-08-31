"use client";

import { useEffect, useState } from "react";
import { Flame, Info, Layers, FileQuestion, GraduationCap, Trophy } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

type LeaderboardRow = {
  student_id: string;
  display_name: string | null;
  points: number;
  streak_days: number;
  rank: number;
};

const podiumStyles = [
  { medal: "🥇", color: "from-amber-400 to-yellow-500", ring: "ring-amber-300" },
  { medal: "🥈", color: "from-slate-300 to-slate-400", ring: "ring-slate-300" },
  { medal: "🥉", color: "from-orange-400 to-amber-600", ring: "ring-orange-300" },
];

export default function LeaderboardPage() {
  const { supabase, session } = useSupabase();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc("get_leaderboard", { limit_count: 100 });
      if (rpcError) {
        setError(rpcError.message);
      } else {
        setRows((data as LeaderboardRow[]) ?? []);
      }
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myRow = rows.find((r) => r.student_id === session?.user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge color="yellow">
          <Trophy className="h-3.5 w-3.5" /> Leaderboard
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Who&apos;s studying hardest?</h1>
        <p className="text-sm font-semibold text-ink-soft">Earn points by mastering flashcards, acing quiz questions, and finishing mock exams.</p>
      </div>

      <Card className="flex flex-wrap items-start gap-3 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-violet-500" /> +5 pts per mastered flashcard
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileQuestion className="h-3.5 w-3.5 text-sky-500" /> +2 pts per correct quiz answer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-rose-500" /> bonus pts from mock exam scores
          </span>
        </div>
      </Card>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {loading ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading leaderboard…</Card>
      ) : rows.length === 0 ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">
          No points yet — be the first! Master a flashcard or answer a quiz question to appear here.
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {top3.map((row, i) => {
              const style = podiumStyles[i];
              const isMe = row.student_id === session?.user.id;
              return (
                <Card
                  key={row.student_id}
                  className={`relative overflow-hidden bg-gradient-to-br ${style.color} p-5 text-white ${isMe ? `ring-4 ${style.ring}` : ""}`}
                >
                  <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                  <div className="relative flex items-center justify-between">
                    <span className="text-3xl">{style.medal}</span>
                    {row.streak_days > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-extrabold">
                        <Flame className="h-3.5 w-3.5" /> {row.streak_days}
                      </span>
                    ) : null}
                  </div>
                  <p className="relative mt-3 font-heading text-lg font-extrabold capitalize">
                    {row.display_name} {isMe ? <span className="text-white/80">(You)</span> : null}
                  </p>
                  <p className="relative text-sm font-bold text-white/90">{row.points.toLocaleString()} pts</p>
                </Card>
              );
            })}
          </div>

          <Card className="divide-y-2 divide-subtle p-0">
            {rest.map((row) => {
              const isMe = row.student_id === session?.user.id;
              return (
                <div
                  key={row.student_id}
                  className={`flex items-center justify-between gap-3 px-5 py-3 ${isMe ? "bg-violet-50 dark:bg-violet-900/20" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-heading text-sm font-extrabold text-ink-soft">#{row.rank}</span>
                    <span className="font-bold capitalize text-ink">
                      {row.display_name} {isMe ? <span className="text-violet-600">(You)</span> : null}
                    </span>
                    {row.streak_days > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-extrabold text-orange-700">
                        <Flame className="h-3 w-3" /> {row.streak_days}
                      </span>
                    ) : null}
                  </div>
                  <span className="font-heading font-extrabold text-ink">{row.points.toLocaleString()}</span>
                </div>
              );
            })}
          </Card>

          {!myRow && session ? (
            <Card className="p-4 text-center text-sm font-semibold text-ink-soft">
              You&apos;re not ranked yet — study a bit to earn your first points!
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
