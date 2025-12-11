"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };

type ParentRow = {
  id: number;
  question: string | null;
  num: string | null;
  year: string | null;
  season_id: number | null;
  paper: string | null;
  chapter_id: number | null;
  mark_scheme: string | null;
  max_score: number | null;
};

type ChildRow = {
  id: number;
  parent_id: number | null;
  question: string | null;
  mark_scheme: string | null;
  max_score: number | null;
};

type ChapterNode = { id: number; title: string; children: ChapterNode[] };

function HtmlBlock({ html }: { html: string | null }) {
  if (!html) return <p className="text-sm text-gray-600 dark:text-gray-400">No content provided.</p>;
  return (
    <>
      <div className="frq-html max-w-none [&_*]:break-words" dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
      <style jsx global>{`
        .frq-html {
          font-size: 15px;
          line-height: 1.7;
        }
        .frq-html p {
          margin: 0 0 0.75em;
        }
        .frq-html ul,
        .frq-html ol {
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0 0 0.85em !important;
        }
        .frq-html li {
          display: list-item !important;
          margin: 0.25em 0;
        }
        .frq-html blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 0.75rem;
          color: #4b5563;
          margin: 0 0 0.75em;
        }
        .frq-html code {
          background: #f3f4f6;
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
        }
        @media (prefers-color-scheme: dark) {
          .frq-html blockquote {
            border-color: #374151;
            color: #d1d5db;
          }
          .frq-html code {
            background: #1f2937;
            color: #e5e7eb;
          }
        }
      `}</style>
    </>
  );
}

export default function StudentFrqPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [openParents, setOpenParents] = useState<Record<number, boolean>>({});

  const [parents, setParents] = useState<ParentRow[]>([]);
  const [childrenMap, setChildrenMap] = useState<Map<number, ChildRow[]>>(new Map());
  const [activeParentIndex, setActiveParentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMarkSchemes, setOpenMarkSchemes] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
      const opts =
        subjectData?.map((s) => ({
          label: s.code ? `${s.code} - ${s.name ?? ""}`.trim() : s.name ?? String(s.id),
          value: String(s.id),
        })) ?? [];
      setSubjects(opts);
      setSubjectsLoaded(true);
      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        const label = match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id);
        setSelectedSubjectName(label);
        if (typeof window !== "undefined") {
          localStorage.setItem("subject_label", label);
        }
      }
    };
    void loadSubjects();
  }, [selectedSubject, supabase]);

  useEffect(() => {
    setActiveChapterId(null);
    setOpenMarkSchemes(new Set());
  }, [selectedSubject]);

  useEffect(() => {
    setActiveParentIndex((idx) => {
      if (parents.length === 0) return 0;
      return Math.min(idx, parents.length - 1);
    });
  }, [parents]);

  useEffect(() => {
    if (!selectedSubject) return;
    const loadChapters = async () => {
      const { data } = await supabase
        .from("chapter")
        .select("id, title, parent_id, sort")
        .eq("subject_id", Number(selectedSubject))
        .order("parent_id", { ascending: true })
        .order("sort", { ascending: true })
        .order("title", { ascending: true });

      const rows = (data as ChapterRow[]) ?? [];
      setChapters(rows);

      setOpenParents((prev) => {
        const next = { ...prev };
        rows
          .filter((c) => !c.parent_id)
          .forEach((parent, index) => {
            if (next[parent.id] === undefined) {
              next[parent.id] = index === 0;
            }
          });
        return next;
      });

      if (!activeChapterId && rows.length > 0) {
        const firstParent = rows.find((c) => !c.parent_id);
        if (firstParent) setActiveChapterId(firstParent.id);
      } else if (activeChapterId) {
        const exists = rows.some((c) => c.id === activeChapterId);
        if (!exists) setActiveChapterId(null);
      }
    };
    void loadChapters();
  }, [activeChapterId, selectedSubject, supabase]);

  useEffect(() => {
    const fetchFrq = async () => {
      if (!selectedSubject) return;
      setLoading(true);
      setError(null);
      setOpenMarkSchemes(new Set());

      let parentQuery = supabase
        .from("quiz_frq")
        .select("id, question, num, year, season_id, paper, chapter_id, mark_scheme, max_score, parent_id", { count: "exact" })
        .eq("subject_id", Number(selectedSubject))
        .is("parent_id", null)
        .order("id", { ascending: true });
      if (activeChapterId) {
        parentQuery = parentQuery.eq("chapter_id", activeChapterId);
      }
      const { data: parentData, error: parentError } = await parentQuery;
      if (parentError) {
        setError(parentError.message);
        setLoading(false);
        return;
      }
      const parentRows = (parentData as ParentRow[]) ?? [];
      setParents(parentRows);

      const parentIds = parentRows.map((p) => p.id);
      if (parentIds.length === 0) {
        setChildrenMap(new Map());
        setLoading(false);
        return;
      }
      const { data: childData, error: childError } = await supabase
        .from("quiz_frq")
        .select("id, parent_id, question, mark_scheme, max_score")
        .in("parent_id", parentIds)
        .order("id", { ascending: true });
      if (childError) {
        setError(childError.message);
        setLoading(false);
        return;
      }
      const map = new Map<number, ChildRow[]>();
      (childData as ChildRow[]).forEach((row) => {
        if (!row.parent_id) return;
        const list = map.get(row.parent_id) ?? [];
        list.push(row);
        map.set(row.parent_id, list);
      });
      setChildrenMap(map);
      setActiveParentIndex(0);
      setLoading(false);
    };
    void fetchFrq();
  }, [activeChapterId, selectedSubject, supabase]);

  const subjectLabel = useMemo(() => selectedSubjectName || subjects.find((s) => s.value === selectedSubject)?.label || "", [selectedSubject, selectedSubjectName, subjects]);

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

  const toggleMarkScheme = (id: number) => {
    setOpenMarkSchemes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  if (!subjectsLoaded) {
    return <div className="p-6 text-sm text-gray-600 dark:text-gray-400">Loading subjects...</div>;
  }

  if (!selectedSubject) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-700 dark:text-gray-200">Pick a subject in the dashboard home to view free response questions.</p>
      </div>
    );
  }

  return (
      <div className="space-y-2">
      <div className="space-y-2" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <button
          type="button"
          onClick={() => setShowChapterModal(true)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100 lg:hidden"
        >
          Chapters
        </button>

        <aside className="sticky top-4 hidden h-fit max-h-[80vh] w-full flex-shrink-0 rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-neutral-900 lg:block lg:w-[420px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Free Response</p>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{subjectLabel || "Select a subject"}</div>
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

        <div className="flex-1 space-y-4 rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {subjectLabel} / {activeChapterTitle}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{loading ? "Loading..." : `${parents.length} parent${parents.length === 1 ? "" : "s"}`}</div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-5 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-neutral-900 dark:text-gray-200">
              Loading free response questions...
            </div>
          ) : parents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-5 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-neutral-900 dark:text-gray-200">
              No free response questions for this chapter yet.
            </div>
          ) : (
            (() => {
              const parent = parents[Math.min(activeParentIndex, parents.length - 1)];
              const childRows = parent ? childrenMap.get(parent.id) ?? [] : [];
              const showParentIdx = Math.min(activeParentIndex, parents.length - 1);
              return parent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-950">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Parent</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {parent.num ? <span className="rounded bg-gray-100 px-2 py-1 dark:bg-neutral-800">Q{parent.num}</span> : null}
                        {parent.year ? <span className="rounded bg-gray-100 px-2 py-1 dark:bg-neutral-800">Year {parent.year}</span> : null}
                        {parent.season_id ? <span className="rounded bg-gray-100 px-2 py-1 dark:bg-neutral-800">Season {parent.season_id}</span> : null}
                        {parent.paper ? <span className="rounded bg-gray-100 px-2 py-1 dark:bg-neutral-800">Paper {parent.paper}</span> : null}
                        {parent.max_score ? (
                          <span className="rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
                            Score: {parent.max_score}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        Parent {showParentIdx + 1} / {parents.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveParentIndex((idx) => Math.max(0, idx - 1))}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                          disabled={showParentIdx === 0}
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveParentIndex((idx) => Math.min(parents.length - 1, idx + 1))}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                          disabled={showParentIdx >= parents.length - 1}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-950">
                    <HtmlBlock html={parent.question} />
                    {parent.mark_scheme ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => toggleMarkScheme(parent.id)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {openMarkSchemes.has(parent.id) ? "Hide mark scheme" : "Show mark scheme"}
                        </button>
                        {openMarkSchemes.has(parent.id) ? (
                          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100">
                            <HtmlBlock html={parent.mark_scheme} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {childRows.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No child questions for this parent.</p>
                    ) : (
                      childRows.map((child, index) => (
                        <div
                          key={child.id}
                          className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {child.max_score ? (
                                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
                                  Score: {child.max_score}
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleMarkScheme(child.id)}
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              {openMarkSchemes.has(child.id) ? "Hide mark scheme" : "Show mark scheme"}
                            </button>
                          </div>
                          <div className="mt-2 text-sm text-gray-800 dark:text-gray-100">
                            {child.question ? <HtmlBlock html={child.question} /> : <span>No question text.</span>}
                          </div>
                          {child.mark_scheme && openMarkSchemes.has(child.id) ? (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100">
                              <HtmlBlock html={child.mark_scheme} />
                            </div>
                          ) : null}
                          <div className="mt-3">
                            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Your answer</label>
                            <textarea
                              value={answers[`child-${child.id}`] ?? ""}
                              onChange={(e) => handleAnswerChange(`child-${child.id}`, e.target.value)}
                              placeholder="Type your response..."
                              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                              rows={3}
                            />
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                              >
                                Mark my answer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null;
            })()
          )}
        </div>
      </div>
      {showChapterModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-8 lg:hidden">
          <div className="mt-8 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-neutral-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Chapters</p>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{subjectLabel || "Select a subject"}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowChapterModal(false)}
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200"
              >
                X
              </button>
            </div>
            <div className="h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {chapterTree.length === 0 ? (
                  <p className="px-1 text-sm text-gray-600 dark:text-gray-400">No chapters found for this subject yet.</p>
                ) : null}
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
                      {parent.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setActiveChapterId(child.id);
                            setShowChapterModal(false);
                          }}
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
