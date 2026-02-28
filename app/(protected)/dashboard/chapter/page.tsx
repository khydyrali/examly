"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };

const sortChapters = (list: ChapterRow[]) =>
  [...list].sort((a, b) => {
    const sortA = a.sort ?? 0;
    const sortB = b.sort ?? 0;
    if (sortA !== sortB) return sortA - sortB;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });

export default function ChapterPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");

  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const [newParentTitle, setNewParentTitle] = useState("");
  const [newParentSort, setNewParentSort] = useState("");
  const [newChildTitle, setNewChildTitle] = useState("");
  const [newChildSort, setNewChildSort] = useState("");
  const [newSubTitle, setNewSubTitle] = useState("");
  const [newSubSort, setNewSubSort] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    if (!stored) {
      alert("Please select a subject first.");
      router.replace("/dashboard");
      return;
    }
    setSelectedSubject(stored);
  }, [router]);

  const refreshChapters = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    const [{ data: subjectData }, { data: chapterData }] = await Promise.all([
      supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
      supabase
        .from("chapter")
        .select("id, title, parent_id, sort")
        .eq("subject_id", Number(selectedSubject))
        .order("sort", { ascending: true, nullsFirst: false })
        .order("title", { ascending: true }),
    ]);

    setSubjects(
      (subjectData ?? []).map((s) => ({
        label: s.code ? `${s.code} - ${s.name ?? ""}`.trim() : s.name ?? String(s.id),
        value: String(s.id),
      })),
    );
    setChapters((chapterData as ChapterRow[]) ?? []);

    const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
    if (match) {
      setSelectedSubjectName(match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    void refreshChapters();
  }, [selectedSubject]);

  const parents = useMemo(() => sortChapters(chapters.filter((c) => !c.parent_id)), [chapters]);
  const children = useMemo(
    () => sortChapters(chapters.filter((c) => c.parent_id && c.parent_id === selectedParentId)),
    [chapters, selectedParentId],
  );
  const subChildren = useMemo(
    () => sortChapters(chapters.filter((c) => c.parent_id && c.parent_id === selectedChildId)),
    [chapters, selectedChildId],
  );

  const handleAddParent = async () => {
    if (!selectedSubject) return;
    const title = newParentTitle.trim();
    if (!title) {
      alert("Enter a parent chapter title.");
      return;
    }
    await supabase.from("chapter").insert([
      { subject_id: Number(selectedSubject), title, parent_id: null, sort: newParentSort ? Number(newParentSort) : null },
    ]);
    setNewParentTitle("");
    setNewParentSort("");
    await refreshChapters();
  };

  const handleAddChild = async () => {
    if (!selectedSubject) return;
    if (!selectedParentId) {
      alert("Select a parent first.");
      return;
    }
    const title = newChildTitle.trim();
    if (!title) {
      alert("Enter a sub-chapter title.");
      return;
    }
    await supabase.from("chapter").insert([
      {
        subject_id: Number(selectedSubject),
        title,
        parent_id: selectedParentId,
        sort: newChildSort ? Number(newChildSort) : null,
      },
    ]);
    setNewChildTitle("");
    setNewChildSort("");
    await refreshChapters();
  };

  const handleAddSub = async () => {
    if (!selectedSubject) return;
    if (!selectedChildId) {
      alert("Select a sub-chapter first.");
      return;
    }
    const title = newSubTitle.trim();
    if (!title) {
      alert("Enter a sub-sub chapter title.");
      return;
    }
    await supabase.from("chapter").insert([
      { subject_id: Number(selectedSubject), title, parent_id: selectedChildId, sort: newSubSort ? Number(newSubSort) : null },
    ]);
    setNewSubTitle("");
    setNewSubSort("");
    await refreshChapters();
  };

  const handleEditChapter = async (row: ChapterRow) => {
    const nextTitle = prompt("Update title", row.title ?? "") ?? undefined;
    if (nextTitle === undefined) return;
    const nextSortRaw = prompt("Update sort (optional)", row.sort !== null && row.sort !== undefined ? String(row.sort) : "") ?? undefined;
    if (nextSortRaw === undefined) return;
    const payload: { title: string; sort: number | null } = {
      title: nextTitle.trim() || row.title || "",
      sort: nextSortRaw.trim() ? Number(nextSortRaw) : null,
    };
    await supabase.from("chapter").update(payload).eq("id", row.id);
    await refreshChapters();
  };

  if (!selectedSubject) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Chapters</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Manage {selectedSubjectName ? `${selectedSubjectName} chapters` : "chapters"}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Three-column view: parent &gt; sub &gt; sub-sub chapters on one screen.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Level 1</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Parent chapters</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Top-level chapters for the subject.</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{loading ? "Loading..." : `${parents.length} total`}</div>
          </div>
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-neutral-950">
            <input
              value={newParentTitle}
              onChange={(e) => setNewParentTitle(e.target.value)}
              placeholder="Parent title"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
            />
            <div className="flex items-center gap-2">
              <input
                value={newParentSort}
                onChange={(e) => setNewParentSort(e.target.value)}
                placeholder="Sort (optional)"
                type="number"
                className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <button
                onClick={handleAddParent}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Add parent
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-neutral-950">
            {parents.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">No parent chapters yet.</p>
            ) : (
              parents.map((p) => {
                const active = p.id === selectedParentId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-2 text-sm transition ${
                      active
                        ? "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                        : "hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParentId(p.id);
                        setSelectedChildId(null);
                      }}
                      className="flex flex-col text-left"
                    >
                      <span className="font-semibold">{p.title || `Parent ${p.id}`}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Sort: {p.sort ?? "-"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditChapter(p)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                    >
                      Edit
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Level 2</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Sub-chapters</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Children of the selected parent.</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{selectedParentId ? `${children.length} total` : "Pick a parent"}</div>
          </div>
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-neutral-950">
            <input
              value={newChildTitle}
              onChange={(e) => setNewChildTitle(e.target.value)}
              placeholder="Sub-chapter title"
              disabled={!selectedParentId}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
            />
            <div className="flex items-center gap-2">
              <input
                value={newChildSort}
                onChange={(e) => setNewChildSort(e.target.value)}
                placeholder="Sort (optional)"
                type="number"
                disabled={!selectedParentId}
                className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <button
                onClick={handleAddChild}
                disabled={!selectedParentId}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add sub-chapter
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-neutral-950">
            {selectedParentId && children.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">No sub-chapters yet.</p>
            ) : !selectedParentId ? (
              <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Select a parent to view sub-chapters.</p>
            ) : (
              children.map((c) => {
                const active = c.id === selectedChildId;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between px-3 py-2 text-sm transition ${
                      active
                        ? "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                        : "hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedChildId(c.id)}
                      className="flex flex-col text-left"
                    >
                      <span className="font-semibold">{c.title || `Chapter ${c.id}`}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Sort: {c.sort ?? "-"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditChapter(c)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                    >
                      Edit
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Level 3</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Sub-sub chapters</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Children of the selected sub-chapter.</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedChildId ? `${subChildren.length} total` : selectedParentId ? "Pick a sub-chapter" : "Pick a parent"}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-neutral-950">
            <input
              value={newSubTitle}
              onChange={(e) => setNewSubTitle(e.target.value)}
              placeholder="Sub-sub title"
              disabled={!selectedChildId}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
            />
            <div className="flex items-center gap-2">
              <input
                value={newSubSort}
                onChange={(e) => setNewSubSort(e.target.value)}
                placeholder="Sort (optional)"
                type="number"
                disabled={!selectedChildId}
                className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <button
                onClick={handleAddSub}
                disabled={!selectedChildId}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add sub-sub
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-neutral-950">
            {selectedChildId && subChildren.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">No sub-sub chapters yet.</p>
            ) : !selectedChildId ? (
              <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Select a sub-chapter to view children.</p>
            ) : (
              subChildren.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{s.title || `Chapter ${s.id}`}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Sort: {s.sort ?? "-"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditChapter(s)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
