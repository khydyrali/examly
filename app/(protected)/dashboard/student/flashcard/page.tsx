"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Layers,
  Menu,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };
type FlashcardRow = { id: number; front: string | null; back: string | null; chapter_id: number | null };
type ChapterNode = { id: number; title: string; children: ChapterNode[] };
type CardStatus = "new" | "learning" | "mastered";

function FlashcardCard({ card, flipped, onFlip }: { card: FlashcardRow; flipped: boolean; onFlip: () => void }) {
  return (
    <div
      className="group relative h-80 w-full cursor-pointer sm:h-96 [perspective:1400px]"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={`relative h-full w-full rounded-3xl border-2 border-subtle bg-surface shadow-pop transition duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 flex flex-col gap-4 rounded-3xl px-6 py-6 [backface-visibility:hidden] sm:px-8 sm:py-8">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-violet-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" /> Front
            </span>
            <span className="text-[10px] font-bold text-ink-soft">Tap to flip</span>
          </div>
          <div className="flex-1 overflow-auto text-lg leading-relaxed text-ink md:text-xl">
            <div className="flex h-full w-full items-center justify-center text-center">
              <div dangerouslySetInnerHTML={{ __html: card.front ?? "No front text provided." }} />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col gap-4 rounded-3xl px-6 py-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:px-8 sm:py-8">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-teal-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Back
            </span>
            <span className="text-[10px] font-bold text-ink-soft">Tap to flip</span>
          </div>
          <div className="flex-1 overflow-auto text-lg leading-relaxed text-ink md:text-xl">
            <div className="flex h-full w-full items-center justify-center text-center">
              <div dangerouslySetInnerHTML={{ __html: card.back ?? "No back text provided." }} />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onFlip();
        }}
        className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-700"
      >
        <RotateCw className="h-3.5 w-3.5" /> Flip
      </button>
    </div>
  );
}

export default function StudentFlashcardPage() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({});
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStatus, setCardStatus] = useState<Record<number, CardStatus>>({});
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);

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
    if (!selectedSubject) return;
    let isMounted = true;

    const load = async () => {
      const subjectId = Number(selectedSubject);
      const [{ data: subjectData, error: subjectError }, { data: chapterData, error: chapterError }] = await Promise.all([
        supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
        supabase
          .from("chapter")
          .select("id, title, parent_id, sort, subject_id")
          .eq("subject_id", subjectId)
          .order("parent_id", { ascending: true })
          .order("sort", { ascending: true })
          .order("title", { ascending: true }),
      ]);

      if (!isMounted) return;

      if (subjectError || chapterError) {
        setLoadError(subjectError?.message ?? chapterError?.message ?? "Unable to load chapters.");
      }

      setChapters((chapterData as ChapterRow[]) ?? []);
      setFlashcards([]);
      setCardStatus({});
      setCurrentIndex(0);

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

      setActiveChapterId(null);

      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        const label = match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id);
        setSelectedSubjectName(label);
        if (typeof window !== "undefined") {
          localStorage.setItem("subject_label", label);
        }
      }

    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  const fetchFlashcardsForChapter = async (chapterId: number) => {
    if (!selectedSubject) return;

    setActiveChapterId(chapterId);
    setLoading(true);
    setLoadError(null);
    const subjectId = Number(selectedSubject);

    const { data, error } = await supabase
      .from("flashcard")
      .select("id, front, back, chapter_id, subject_id, created_at")
      .eq("subject_id", subjectId)
      .eq("chapter_id", chapterId)
      .order("created_at", { ascending: true })
      .limit(1000); // cap per chapter

    if (error) {
      setLoadError(error.message ?? "Unable to load flashcards.");
      setLoading(false);
      return;
    }

    setFlashcards((data as FlashcardRow[]) ?? []);
    setLoading(false);
  };

  const filteredCards = useMemo(() => {
    if (!activeChapterId) return [];
    return flashcards;
  }, [activeChapterId, flashcards]);

  useEffect(() => {
    setCurrentIndex(0);
    setFlippedCards({});
  }, [filteredCards]);

  useEffect(() => {
    const syncCardStatus = async () => {
      if (!session || flashcards.length === 0) {
        setCardStatus({});
        return;
      }

      const flashcardIds = flashcards.map((card) => card.id);
      const pageSize = 1000;
      const batches = [];
      for (let i = 0; i < flashcardIds.length; i += pageSize) {
        const slice = flashcardIds.slice(i, i + pageSize);
        batches.push(
          supabase
            .from("student_flashcard")
            .select("flashcard_id, status")
            .eq("student_id", session.user.id)
            .in("flashcard_id", slice),
        );
      }

      const results = await Promise.all(batches);
      const next: Record<number, CardStatus> = {};

      results.forEach(({ data, error }) => {
        if (error) {
          console.error("Failed to load flashcard statuses", error);
          return;
        }

        (data ?? []).forEach((row) => {
          if (row.flashcard_id !== null) {
            next[Number(row.flashcard_id)] = row.status as CardStatus;
          }
        });
      });

      setCardStatus(next);
    };

    void syncCardStatus();
  }, [flashcards, session, supabase]);

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

  const activeChapterTitle = useMemo(() => {
    if (!activeChapterId) return "Select a chapter";
    const match = chapters.find((c) => c.id === activeChapterId);
    return match?.title ?? "Selected chapter";
  }, [activeChapterId, chapters]);

  const toggleParent = (id: number) => {
    setOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFlip = (id: number) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCard = filteredCards[currentIndex];
  const subjectLabel =
    selectedSubjectName || (selectedSubject && !subjectsLoaded ? "Loading subject..." : selectedSubject ? "Subject" : "");
  const setStatus = async (status: CardStatus) => {
    if (!currentCard || !session) return;
    setStatusError(null);
    const previous = cardStatus[currentCard.id];
    setCardStatus((prev) => ({ ...prev, [currentCard.id]: status }));
    setStatusSaving(true);

    const payload = { flashcard_id: currentCard.id, student_id: session.user.id, status };
    const isExisting = previous !== undefined;

    const { error } = isExisting
      ? await supabase
          .from("student_flashcard")
          .update(payload)
          .eq("flashcard_id", currentCard.id)
          .eq("student_id", session.user.id)
      : await supabase
          .from("student_flashcard")
          .insert({
            id: Date.now(), // bigint-friendly ID for tables without a default
            ...payload,
          });

    setStatusSaving(false);

    if (error) {
      const message = (error as { message?: string })?.message ?? JSON.stringify(error);
      console.error("Failed to update flashcard status", message);
      setStatusError(message || "Unable to update status. Check Supabase policy/constraints.");
      setCardStatus((prev) => {
        if (previous === undefined) {
          const { [currentCard.id]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [currentCard.id]: previous };
      });
      return;
    }

    void supabase
      .from("student_activity_log")
      .upsert({ student_id: session.user.id, activity_date: new Date().toISOString().slice(0, 10) }, { onConflict: "student_id,activity_date" });

    setCurrentIndex((idx) => (idx < filteredCards.length - 1 ? idx + 1 : idx));
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge color="orange">
            <Layers className="h-3.5 w-3.5" /> Student Flashcards
          </Badge>
          <h1 className="font-heading text-3xl font-extrabold text-ink">Select a subject to view flashcards</h1>
          <p className="text-sm font-semibold text-ink-soft">Choose a subject below or go back to the dashboard to pick one.</p>
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

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {loadError ? <p className="text-sm font-semibold text-rose-600">{loadError}</p> : null}

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
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Flashcards</p>
              <div className="text-sm font-bold text-ink">{subjectLabel || "Select a subject"}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveChapterId(null);
                setFlashcards([]);
                setCardStatus({});
                setCurrentIndex(0);
                setLoadError(null);
                setLoading(false);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition ${
                activeChapterId === null
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop"
                  : "border-2 border-subtle bg-surface text-ink hover:bg-subtle"
              }`}
            >
              All chapters
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {chapterTree.length === 0 ? (
              <p className="px-1 text-sm font-semibold text-ink-soft">No chapters found for this subject yet.</p>
            ) : null}
            <div className="space-y-2.5">
              {chapterTree.map((parent) => {
                const isOpen = openParents[parent.id];
                return (
                  <div key={parent.id} className="overflow-hidden rounded-2xl border-2 border-subtle bg-surface shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleParent(parent.id)}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm font-bold transition ${
                        isOpen ? "bg-subtle text-violet-700" : "bg-surface text-ink hover:bg-subtle/60"
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
                          onClick={() => void fetchFlashcardsForChapter(child.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm leading-tight font-semibold transition ${
                            activeChapterId === child.id
                              ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm"
                              : "text-ink hover:bg-surface"
                          }`}
                        >
                          <span className="line-clamp-1">{child.title}</span>
                          <span className={`text-[11px] font-bold ${activeChapterId === child.id ? "text-white/80" : "text-ink-soft"}`}>
                            Open
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border-2 border-subtle bg-surface/95 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-violet-600">
                <span>{subjectLabel || "Flashcards"}</span>
                <span className="text-violet-300">/</span>
                <span className="text-ink-soft">{activeChapterTitle}</span>
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-ink">{activeChapterTitle}</h2>
              <p className="text-sm font-semibold text-ink-soft">
                {loading ? "Loading flashcards..." : `${filteredCards.length} card${filteredCards.length === 1 ? "" : "s"} in view.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0 || filteredCards.length === 0}
                className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.min(filteredCards.length - 1, idx + 1))}
                disabled={currentIndex >= filteredCards.length - 1 || filteredCards.length === 0}
                className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle disabled:opacity-40"
              >
                Next
              </button>
              <span className="text-xs font-bold text-ink-soft">
                {filteredCards.length > 0 ? `Card ${currentIndex + 1} of ${filteredCards.length}` : "No cards"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge color="yellow">Still learning: {filteredCards.filter((c) => cardStatus[c.id] === "learning").length}</Badge>
            <Badge color="teal">Know: {filteredCards.filter((c) => cardStatus[c.id] === "mastered").length}</Badge>
          </div>

          <div>
            {loading ? (
              <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
                Loading flashcards...
              </div>
            ) : !currentCard ? (
              <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
                No flashcards for this selection yet.
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-5">
                <FlashcardCard card={currentCard} flipped={!!flippedCards[currentCard.id]} onFlip={() => toggleFlip(currentCard.id)} />
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={statusSaving}
                    onClick={() => void setStatus("learning")}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-sm transition disabled:opacity-60 ${
                      cardStatus[currentCard.id] === "learning"
                        ? "bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 shadow-pop-orange"
                        : "border-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    <Brain className="h-4 w-4" /> Still learning
                  </button>
                  <button
                    type="button"
                    disabled={statusSaving}
                    onClick={() => void setStatus("mastered")}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-sm transition disabled:opacity-60 ${
                      cardStatus[currentCard.id] === "mastered"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-pop-teal"
                        : "border-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Know
                  </button>
                </div>
                {statusError ? <p className="text-center text-sm font-semibold text-rose-600">{statusError}</p> : null}
              </div>
            )}
          </div>
        </section>
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
              <div className="space-y-3">
                {chapterTree.length === 0 ? (
                  <p className="px-1 text-sm font-semibold text-ink-soft">No chapters found for this subject yet.</p>
                ) : null}
                {chapterTree.map((parent) => {
                  const isOpen = openParents[parent.id];
                  const isActive = activeChapterId === parent.id;
                  return (
                    <div key={parent.id} className="overflow-hidden rounded-2xl border-2 border-subtle bg-surface shadow-sm">
                      <button
                        type="button"
                        onClick={() => toggleParent(parent.id)}
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
                            onClick={() => {
                              void fetchFlashcardsForChapter(child.id);
                              setShowChapterModal(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm leading-tight font-semibold transition ${
                              activeChapterId === child.id
                                ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm"
                                : "text-ink hover:bg-surface"
                            }`}
                          >
                            <span className="line-clamp-1">{child.title}</span>
                            <span className={`text-[11px] font-bold ${activeChapterId === child.id ? "text-white/80" : "text-ink-soft"}`}>
                              Open
                            </span>
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
