"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

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
  if (!html) return <p className="text-sm text-gray-600 dark:text-gray-400">No note content yet.</p>;
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
          color: #0f172a;
          font-weight: 600;
        }
        .note-html blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 0.75rem;
          color: #4b5563;
          margin: 0 0 0.75em;
        }
        .note-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
        }
        .note-html th,
        .note-html td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
        }
        .note-html img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .note-html code {
          background: #f3f4f6;
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
        }
        @media (prefers-color-scheme: dark) {
          .note-html blockquote {
            border-color: #374151;
            color: #d1d5db;
          }
          .note-html th,
          .note-html td {
            border-color: #374151;
          }
          .note-html code {
            background: #1f2937;
            color: #e5e7eb;
          }
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

  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({});
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);

  const [notes, setNotes] = useState<StudentNoteRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!selectedSubject) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Student Notes</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Select a subject to view notes</h1>
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
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          {selectedSubjectName ? `${selectedSubjectName} notes` : "Student notes"}
        </h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="sticky top-4 z-20 w-full flex-shrink-0 rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-neutral-900 lg:w-[360px] max-h-[calc(100vh-32px)] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Chapters</p>
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
          <div className="px-3 pb-4">
            {chapterTree.length === 0 ? (
              <p className="px-1 pt-3 text-sm text-gray-600 dark:text-gray-400">No chapters found for this subject yet.</p>
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
                <span>{selectedSubjectName || "Notes"}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 dark:text-gray-400">{activeChapterTitle}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{activeChapterTitle}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? "Loading notes..." : `${filteredNotes.length} note${filteredNotes.length === 1 ? "" : "s"} in view.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0 || filteredNotes.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.min(filteredNotes.length - 1, idx + 1))}
                disabled={currentIndex >= filteredNotes.length - 1 || filteredNotes.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Next
              </button>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {filteredNotes.length > 0 ? `Note ${currentIndex + 1} of ${filteredNotes.length}` : "No notes"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
              Loading notes...
            </div>
          ) : !currentNote ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-neutral-950/50 dark:text-gray-300">
              No notes for this selection yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Note</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{currentNote.title || "Untitled note"}</h3>
                </div>
                {currentNote.edited_at ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(currentNote.edited_at).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 overflow-auto text-base leading-relaxed text-gray-900 dark:text-gray-100">
                <HtmlNote html={currentNote.caption} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
