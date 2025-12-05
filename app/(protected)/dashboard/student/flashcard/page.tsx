"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };
type FlashcardRow = { id: number; front: string | null; back: string | null; chapter_id: number | null };
type ChapterNode = { id: number; title: string; children: ChapterNode[] };

function FlashcardCard({ card, flipped, onFlip }: { card: FlashcardRow; flipped: boolean; onFlip: () => void }) {
  return (
    <div className="group relative h-72 w-full cursor-pointer [perspective:1200px]" onClick={onFlip} role="button" tabIndex={0} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onFlip();
      }
    }}>
      <div
        className={`relative h-full w-full rounded-2xl border border-gray-200 bg-white/90 shadow-md transition duration-500 [transform-style:preserve-3d] dark:border-gray-800 dark:bg-neutral-900 ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 flex flex-col gap-3 rounded-2xl px-5 py-4 [backface-visibility:hidden]">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-blue-600">
            <span>Front</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Click to flip</span>
          </div>
          <div className="flex-1 overflow-auto text-lg leading-relaxed text-gray-900 dark:text-gray-100 md:text-xl">
            <div className="flex h-full w-full items-center justify-center text-center">
              <div dangerouslySetInnerHTML={{ __html: card.front ?? "No front text provided." }} />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col gap-3 rounded-2xl px-5 py-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-emerald-600">
            <span>Back</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Click to flip</span>
          </div>
          <div className="flex-1 overflow-auto text-lg leading-relaxed text-gray-900 dark:text-gray-100 md:text-xl">
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
        className="absolute bottom-3 right-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-blue-700"
      >
        Flip
      </button>
    </div>
  );
}

export default function StudentFlashcardPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({});
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStatus, setCardStatus] = useState<Record<number, "learning" | "learned">>({});

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    if (stored) {
      setSelectedSubject(stored);
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
        setSelectedSubjectName(match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
      }
    };
    void loadSubjects();
  }, [selectedSubject, supabase]);

  useEffect(() => {
    if (!selectedSubject) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      const subjectId = Number(selectedSubject);
      const [{ data: subjectData, error: subjectError }, { data: chapterData, error: chapterError }, { data: cardData, error: cardError }] =
        await Promise.all([
          supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
          supabase
            .from("chapter")
            .select("id, title, parent_id, sort, subject_id")
            .eq("subject_id", subjectId)
            .order("parent_id", { ascending: true })
            .order("sort", { ascending: true })
            .order("title", { ascending: true }),
          supabase
            .from("flashcard")
            .select("id, front, back, chapter_id, subject_id, created_at")
            .eq("subject_id", subjectId)
            .order("chapter_id", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);

      if (!isMounted) return;

      if (subjectError || chapterError || cardError) {
        setLoadError(subjectError?.message ?? chapterError?.message ?? cardError?.message ?? "Unable to load flashcards.");
      }

      setChapters((chapterData as ChapterRow[]) ?? []);
      setFlashcards((cardData as FlashcardRow[]) ?? []);

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

      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        setSelectedSubjectName(match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
      }

      setLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  const filteredCards = useMemo(() => {
    if (!activeChapterId) return flashcards;
    return flashcards.filter((card) => card.chapter_id === activeChapterId);
  }, [activeChapterId, flashcards]);

  useEffect(() => {
    setCurrentIndex(0);
    setFlippedCards({});
  }, [filteredCards]);

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
    if (!activeChapterId) return "All chapters";
    const match = chapters.find((c) => c.id === activeChapterId);
    return match?.title ?? "Selected chapter";
  }, [activeChapterId, chapters]);

  const toggleParent = (id: number) => {
    setOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
    setActiveChapterId(id);
  };

  const toggleFlip = (id: number) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCard = filteredCards[currentIndex];
  const setStatus = (status: "learning" | "learned") => {
    if (!currentCard) return;
    setCardStatus((prev) => ({ ...prev, [currentCard.id]: status }));
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Student Flashcards</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Select a subject to view flashcards</h1>
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
                localStorage.setItem("subject_id", value);
                setSelectedSubject(value);
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          {selectedSubjectName ? `${selectedSubjectName} flashcards` : "Student flashcards"}
        </h1>
        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="sticky top-4 h-fit max-h-[80vh] w-full flex-shrink-0 rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-neutral-900 lg:w-[360px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Flashcards</p>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{selectedSubjectName || "Select a subject"}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveChapterId(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition ${
                activeChapterId === null
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              }`}
            >
              All chapters
            </button>
          </div>
          <div className="h-[calc(80vh-120px)] overflow-y-auto px-3 pb-4">
            {chapterTree.length === 0 ? (
              <p className="px-1 text-sm text-gray-600 dark:text-gray-400">No chapters found for this subject yet.</p>
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
                      <button
                        type="button"
                        onClick={() => setActiveChapterId(parent.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                          activeChapterId === parent.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-800 hover:bg-white dark:text-gray-100 dark:hover:bg-neutral-800"
                        }`}
                      >
                        <span>Study parent</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">All topics</span>
                      </button>
                      {parent.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setActiveChapterId(child.id)}
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
                <span>{selectedSubjectName || "Flashcards"}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 dark:text-gray-400">{activeChapterTitle}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{activeChapterTitle}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? "Loading flashcards..." : `${filteredCards.length} card${filteredCards.length === 1 ? "" : "s"} in view.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0 || filteredCards.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.min(filteredCards.length - 1, idx + 1))}
                disabled={currentIndex >= filteredCards.length - 1 || filteredCards.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Next
              </button>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {filteredCards.length > 0 ? `Card ${currentIndex + 1} of ${filteredCards.length}` : "No cards"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
              Still learning: {filteredCards.filter((c) => cardStatus[c.id] === "learning").length}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              Know: {filteredCards.filter((c) => cardStatus[c.id] === "learned").length}
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
                Loading flashcards...
              </div>
            ) : !currentCard ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
                No flashcards for this selection yet.
              </div>
            ) : (
              <div className="space-y-4">
                <FlashcardCard card={currentCard} flipped={!!flippedCards[currentCard.id]} onFlip={() => toggleFlip(currentCard.id)} />
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setStatus("learning")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                      cardStatus[currentCard.id] === "learning"
                        ? "bg-amber-500 text-white"
                        : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
                    }`}
                  >
                    <span aria-hidden className="h-4 w-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="9" cy="10" r="0.9" />
                        <circle cx="15" cy="10" r="0.9" />
                        <path d="M9 16h6" />
                      </svg>
                    </span>
                    Still learning
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("learned")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                      cardStatus[currentCard.id] === "learned"
                        ? "bg-emerald-500 text-white"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60"
                    }`}
                  >
                    <span aria-hidden className="h-4 w-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="9" cy="10" r="0.9" />
                        <circle cx="15" cy="10" r="0.9" />
                        <path d="M8.5 14.5c1.5 2 5.5 2 7 0" />
                      </svg>
                    </span>
                    Know
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
