"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Menu, ScrollText, X } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };
type ChapterNode = { id: number; title: string; children: ChapterNode[] };
type StudentNoteRow = {
  id: number;
  title: string | null;
  caption: string | null;
  chapter_id: number | null;
  subject_id: number | null;
  edited_at?: string | null;
  created_at?: string | null;
};

function HtmlNote({ html }: { html: string | null }) {
  if (!html) return <p className="text-sm font-semibold text-ink-soft">No note content yet.</p>;
  return (
    <>
      <div className="note-html max-w-none [&_*]:break-words" dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
      <style jsx global>{`
        .note-html {
          font-size: 15px;
          line-height: 1.7;
        }
        .note-html h1,
        .note-html h2,
        .note-html h3,
        .note-html h4,
        .note-html h5,
        .note-html h6 {
          font-weight: 700;
          margin: 1.1em 0 0.5em;
        }
        .note-html p {
          margin: 0 0 0.75em;
        }
        .note-html ul,
        .note-html ol {
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0 0 0.85em !important;
        }
        .note-html ul {
          list-style-type: disc !important;
        }
        .note-html ol {
          list-style-type: decimal !important;
        }
        .note-html li {
          display: list-item !important;
          margin: 0.25em 0;
        }
        .note-html li::marker {
          color: var(--color-primary);
          font-weight: 600;
        }
        .note-html blockquote {
          border-left: 3px solid #e9d5ff;
          padding-left: 0.75rem;
          color: var(--color-ink-soft);
          margin: 0 0 0.75em;
        }
        .note-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
        }
        .note-html th,
        .note-html td {
          border: 1px solid #e9d5ff;
          padding: 0.5rem 0.75rem;
        }
        .note-html img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .note-html code {
          background: #f4f1ff;
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
        }
      `}</style>
    </>
  );
}

export default function StudentNotePage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({});
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);

  const [notes, setNotes] = useState<StudentNoteRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    const storedLabel = typeof window !== "undefined" ? localStorage.getItem("subject_label") : null;
    if (storedId) {
      setSelectedSubject(storedId);
      if (storedLabel) {
        setSelectedSubjectName(storedLabel);
      }
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
        if (typeof window !== "undefined") {
          localStorage.setItem("subject_label", match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
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
      setLoading(true);
      setError(null);
      const subjectId = Number(selectedSubject);

      const [{ data: chapterData, error: chapterError }, { data: noteData, error: noteError }] = await Promise.all([
        supabase
          .from("chapter")
          .select("id, title, parent_id, sort, subject_id")
          .eq("subject_id", subjectId)
          .order("parent_id", { ascending: true })
          .order("sort", { ascending: true })
          .order("title", { ascending: true }),
        supabase
          .from("note")
          .select("id, title, caption, chapter_id, subject_id, edited_at, created_at")
          .eq("subject_id", subjectId)
          .order("chapter_id", { ascending: true })
          .order("edited_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (chapterError || noteError) {
        setError(chapterError?.message ?? noteError?.message ?? "Unable to load notes.");
      }

      setChapters((chapterData as ChapterRow[]) ?? []);
      setNotes((noteData as StudentNoteRow[]) ?? []);

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

      setLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedSubject, supabase]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeChapterId, notes]);

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

  const filteredNotes = useMemo(() => {
    if (!activeChapterId) return notes;
    return notes.filter((n) => n.chapter_id === activeChapterId);
  }, [activeChapterId, notes]);

  const currentNote = filteredNotes[currentIndex];

  const activeChapterTitle = useMemo(() => {
    if (!activeChapterId) return "All chapters";
    const match = chapters.find((c) => c.id === activeChapterId);
    return match?.title ?? "Selected chapter";
  }, [activeChapterId, chapters]);

  const toggleParent = (id: number) => {
    setOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
    setActiveChapterId(id);
  };

  const subjectLabel =
    selectedSubjectName || (selectedSubject && !subjectsLoaded ? "Loading subject..." : selectedSubject ? "Subject" : "");

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge color="violet">
            <ScrollText className="h-3.5 w-3.5" /> Student Notes
          </Badge>
          <h1 className="font-heading text-3xl font-extrabold text-ink">Select a subject to view notes</h1>
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
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

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
              onClick={() => setActiveChapterId(null)}
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
                          onClick={() => setActiveChapterId(child.id)}
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
                <span>{subjectLabel || "Notes"}</span>
                <span className="text-violet-300">/</span>
                <span className="text-ink-soft">{activeChapterTitle}</span>
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-ink">{activeChapterTitle}</h2>
              <p className="text-sm font-semibold text-ink-soft">
                {loading ? "Loading notes..." : `${filteredNotes.length} note${filteredNotes.length === 1 ? "" : "s"} in view.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0 || filteredNotes.length === 0}
                className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.min(filteredNotes.length - 1, idx + 1))}
                disabled={currentIndex >= filteredNotes.length - 1 || filteredNotes.length === 0}
                className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:bg-subtle disabled:opacity-40"
              >
                Next
              </button>
              <span className="text-xs font-bold text-ink-soft">
                {filteredNotes.length > 0 ? `Note ${currentIndex + 1} of ${filteredNotes.length}` : "No notes"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
              Loading notes...
            </div>
          ) : !currentNote ? (
            <div className="rounded-2xl border-2 border-dashed border-subtle-strong bg-subtle/50 p-6 text-center text-sm font-semibold text-ink-soft">
              No notes for this selection yet.
            </div>
          ) : (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-violet-600">Note</p>
                  <h3 className="font-heading text-2xl font-extrabold text-ink">{currentNote.title || "Untitled note"}</h3>
                </div>
                {currentNote.edited_at ? (
                  <span className="text-xs font-semibold text-ink-soft">Updated {new Date(currentNote.edited_at).toLocaleDateString()}</span>
                ) : null}
              </div>
              <div className="mt-4 overflow-auto text-base leading-relaxed text-ink">
                <HtmlNote html={currentNote.caption} />
              </div>
            </Card>
          )}
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
                              setActiveChapterId(child.id);
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
