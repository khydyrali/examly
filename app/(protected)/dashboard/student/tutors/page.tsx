"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Circle, Clock, DollarSign, Users } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

type TutorRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  experience_years: number | null;
  hourly_price: number | null;
  currency: string | null;
  is_online: boolean;
};

type Subject = { id: number; name: string | null; code: string | null };

export default function StudentTutorsPage() {
  const { supabase } = useSupabase();
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsByTutor, setSubjectsByTutor] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjectFilter, setSubjectFilter] = useState<number | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [{ data: tutorData, error: tutorError }, { data: subjectData }, { data: links }] = await Promise.all([
        supabase
          .from("tutor_profile")
          .select("id, display_name, avatar_url, bio, experience_years, hourly_price, currency, is_online")
          .order("is_online", { ascending: false }),
        supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
        supabase.from("tutor_subject").select("tutor_id, subject_id"),
      ]);

      if (tutorError) {
        setError(tutorError.message);
        setLoading(false);
        return;
      }

      setTutors(((tutorData as TutorRow[]) ?? []).filter((t) => t.display_name));
      setSubjects(subjectData ?? []);

      const map: Record<string, number[]> = {};
      (links ?? []).forEach((row) => {
        const key = String(row.tutor_id);
        map[key] = map[key] ? [...map[key], Number(row.subject_id)] : [Number(row.subject_id)];
      });
      setSubjectsByTutor(map);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const filteredTutors = useMemo(() => {
    return tutors.filter((t) => {
      if (onlineOnly && !t.is_online) return false;
      if (subjectFilter !== null && !(subjectsByTutor[t.id] ?? []).includes(subjectFilter)) return false;
      return true;
    });
  }, [tutors, onlineOnly, subjectFilter, subjectsByTutor]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge color="teal">
          <Users className="h-3.5 w-3.5" /> Find a Tutor
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Get 1:1 help from a real tutor.</h1>
        <p className="text-sm font-semibold text-ink-soft">Browse by subject, check who&apos;s online now, and compare experience &amp; price.</p>
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setSubjectFilter(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            subjectFilter === null ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop" : "border-2 border-subtle bg-surface text-ink"
          }`}
        >
          All subjects
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubjectFilter(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              subjectFilter === s.id ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop" : "border-2 border-subtle bg-surface text-ink"
            }`}
          >
            {s.name || s.code}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-ink">
          <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="h-4 w-4 rounded" />
          Online now only
        </label>
      </Card>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {loading ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading tutors…</Card>
      ) : filteredTutors.length === 0 ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">No tutors match those filters yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTutors.map((tutor) => (
            <Card key={tutor.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                {tutor.avatar_url ? (
                  <img src={tutor.avatar_url} alt={tutor.display_name ?? "Tutor"} className="h-14 w-14 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-extrabold text-white">
                    {(tutor.display_name ?? "T").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-heading font-bold text-ink">{tutor.display_name}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${tutor.is_online ? "text-emerald-600" : "text-ink-soft"}`}>
                    <Circle className={`h-2 w-2 ${tutor.is_online ? "fill-emerald-500 text-emerald-500" : "fill-ink-soft text-ink-soft"}`} />
                    {tutor.is_online ? "Online now" : "Offline"}
                  </span>
                </div>
              </div>

              {tutor.bio ? <p className="line-clamp-3 text-sm font-semibold text-ink-soft">{tutor.bio}</p> : null}

              <div className="flex flex-wrap gap-1.5">
                {(subjectsByTutor[tutor.id] ?? []).map((sid) => {
                  const subj = subjects.find((s) => s.id === sid);
                  return subj ? (
                    <Badge key={sid} color="violet">
                      {subj.name || subj.code}
                    </Badge>
                  ) : null;
                })}
              </div>

              <div className="mt-auto flex items-center justify-between pt-2 text-sm font-bold text-ink">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-violet-500" /> {tutor.experience_years ?? 0} yrs
                </span>
                {tutor.hourly_price != null ? (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    {tutor.hourly_price} {tutor.currency}/hr
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
