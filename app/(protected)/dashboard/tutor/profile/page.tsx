"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Subject = { id: number; name: string | null; code: string | null };

const AVATAR_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_SUBJECT_BUCKET || "main";

export default function TutorProfilePage() {
  const { supabase, session } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [hourlyPrice, setHourlyPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isOnline, setIsOnline] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      const [{ data: subjectData }, { data: profile }, { data: tutorSubjects }] = await Promise.all([
        supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
        supabase
          .from("tutor_profile")
          .select("display_name, avatar_url, bio, experience_years, hourly_price, currency, is_online")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase.from("tutor_subject").select("subject_id").eq("tutor_id", session.user.id),
      ]);

      setSubjects(subjectData ?? []);
      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setBio(profile.bio ?? "");
        setExperienceYears(profile.experience_years != null ? String(profile.experience_years) : "");
        setHourlyPrice(profile.hourly_price != null ? String(profile.hourly_price) : "");
        setCurrency(profile.currency ?? "USD");
        setIsOnline(Boolean(profile.is_online));
      }
      setSelectedSubjects(new Set((tutorSubjects ?? []).map((row) => Number(row.subject_id))));
      setLoading(false);
    };
    void load();
  }, [session, supabase]);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const path = `avatars/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const toggleSubject = (id: number) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      id: session.user.id,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      bio: bio || null,
      experience_years: experienceYears === "" ? null : Number(experienceYears),
      hourly_price: hourlyPrice === "" ? null : Number(hourlyPrice),
      currency,
      is_online: isOnline,
    };

    const { error: upsertError } = await supabase.from("tutor_profile").upsert(payload);
    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    await supabase.from("tutor_subject").delete().eq("tutor_id", session.user.id);
    if (selectedSubjects.size > 0) {
      const rows = Array.from(selectedSubjects).map((subject_id) => ({ tutor_id: session.user.id, subject_id }));
      const { error: subjectError } = await supabase.from("tutor_subject").insert(rows);
      if (subjectError) {
        setError(subjectError.message);
        setSaving(false);
        return;
      }
    }

    setMessage("Profile saved!");
    setSaving(false);
  };

  if (loading) {
    return <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading your profile…</Card>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Badge color="teal">
          <UserCog className="h-3.5 w-3.5" /> Tutor Profile
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Set up your public tutor card.</h1>
        <p className="text-sm font-semibold text-ink-soft">Students will find you in Find a Tutor once this is filled out.</p>
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-extrabold text-white">
              {displayName.slice(0, 1).toUpperCase() || "T"}
            </div>
          )}
          <div className="flex flex-col gap-2 text-sm">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            {uploading ? <span className="text-xs font-semibold text-ink-soft">Uploading…</span> : null}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-ink">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="e.g. Ms. Rahman"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-ink">Bio / experience summary</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            placeholder="Tell students about your teaching style and background…"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-ink">Years of experience</span>
            <input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-ink">Hourly price</span>
            <input
              type="number"
              min={0}
              value={hourlyPrice}
              onChange={(e) => setHourlyPrice(e.target.value)}
              className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-ink">Currency</span>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            />
          </label>
        </div>

        <label className="flex items-center justify-between rounded-xl border-2 border-subtle bg-subtle/30 px-4 py-3">
          <span className="text-sm font-bold text-ink">Available for students right now</span>
          <button
            type="button"
            onClick={() => setIsOnline((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${isOnline ? "bg-emerald-500" : "bg-subtle-strong"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${isOnline ? "left-6" : "left-1"}`} />
          </button>
        </label>

        <div className="space-y-2">
          <span className="text-sm font-bold text-ink">Subjects you tutor</span>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const active = selectedSubjects.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    active ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop" : "border-2 border-subtle bg-surface text-ink"
                  }`}
                >
                  {s.name || s.code}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}

        <Button onClick={() => void handleSave()} disabled={saving || uploading} className="w-full">
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </Card>
    </div>
  );
}
