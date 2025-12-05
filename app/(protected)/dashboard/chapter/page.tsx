"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null; sort: number | null };

export default function ChapterPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [parentChapters, setParentChapters] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [chapterFilter, setChapterFilter] = useState<string>("");
  const [newParentTitle, setNewParentTitle] = useState<string>("");
  const [newParentSort, setNewParentSort] = useState<string>("");
  const [newChildTitle, setNewChildTitle] = useState<string>("");
  const [newChildSort, setNewChildSort] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    if (!stored) {
      alert("Please select a subject first.");
      router.replace("/dashboard");
      return;
    }
    setSelectedSubject(stored);
  }, [router]);

  useEffect(() => {
    if (!selectedSubject) return;
    const load = async () => {
      const [{ data: subjectData }, { data: chapterData }] = await Promise.all([
        supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
        supabase.from("chapter").select("id, title, parent_id, sort").order("title", { ascending: true }),
      ]);
      setSubjects(
        (subjectData ?? []).map((s) => ({
          label: s.code ? `${s.code} - ${s.name ?? ""}`.trim() : s.name ?? String(s.id),
          value: String(s.id),
        })),
      );

      const chapterRows = (chapterData as ChapterRow[]) ?? [];
      setChapters(chapterRows);
      setParentChapters(chapterRows.filter((c) => !c.parent_id).map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) })));

      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        setSelectedSubjectName(match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
      }
    };
    void load();
  }, [selectedSubject, supabase, refreshKey]);

  const childChapters = useMemo(
    () =>
      chapters
        .filter((c) => (selectedParent ? c.parent_id === Number(selectedParent) : !!c.parent_id))
        .map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) })),
    [chapters, selectedParent],
  );

  const filterOptions = useMemo(() => {
    const parentOptions = parentChapters.map((p) => ({ label: p.label, value: `parent:${p.value}` }));
    return [{ label: "All parents", value: "" }, ...parentOptions];
  }, [parentChapters]);

  const resourceFilters = useMemo(() => {
    const base: { column?: string; value?: string | number | null; or?: string }[] = [
      { column: "subject_id", value: Number(selectedSubject) },
    ];
    if (chapterFilter.startsWith("parent:")) {
      const id = chapterFilter.replace("parent:", "");
      base.push({ or: `parent_id.eq.${id},id.eq.${id}` });
    } else {
      base.push({ column: "parent_id", value: "__NULL__" });
    }
    return base;
  }, [chapterFilter, selectedSubject]);

  const handleAddParent = async () => {
    if (!selectedSubject) return;
    const title = newParentTitle.trim();
    if (!title) {
      alert("Enter a parent chapter title.");
      return;
    }
    await supabase.from("chapter").insert([
      {
        subject_id: Number(selectedSubject),
        title,
        parent_id: null,
        sort: newParentSort ? Number(newParentSort) : null,
      },
    ]);
    setNewParentTitle("");
    setNewParentSort("");
    setRefreshKey((k) => k + 1);
  };

  const handleAddChild = async () => {
    if (!selectedSubject) return;
    if (!selectedParent) {
      alert("Select a parent first.");
      return;
    }
    const title = newChildTitle.trim();
    if (!title) {
      alert("Enter a child chapter title.");
      return;
    }
    await supabase.from("chapter").insert([
      {
        subject_id: Number(selectedSubject),
        title,
        parent_id: Number(selectedParent),
        sort: newChildSort ? Number(newChildSort) : null,
      },
    ]);
    setNewChildTitle("");
    setNewChildSort("");
    setRefreshKey((k) => k + 1);
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
        <p className="text-sm text-gray-600 dark:text-gray-400">Create and edit chapters by subject, order, and hierarchy.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Quick add parent</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={newParentTitle}
                onChange={(e) => setNewParentTitle(e.target.value)}
                placeholder="Parent title"
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <input
                value={newParentSort}
                onChange={(e) => setNewParentSort(e.target.value)}
                placeholder="Sort"
                type="number"
                className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <button
                onClick={handleAddParent}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Add parent
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Quick add child</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedParent}
                onChange={(e) => {
                  setSelectedParent(e.target.value);
                  setSelectedChild("");
                }}
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              >
                <option value="">Select parent (also filters list)</option>
                {parentChapters.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                value={newChildTitle}
                onChange={(e) => setNewChildTitle(e.target.value)}
                placeholder="Child title"
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <input
                value={newChildSort}
                onChange={(e) => setNewChildSort(e.target.value)}
                placeholder="Sort"
                type="number"
                className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
              />
              <button
                onClick={handleAddChild}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Add child
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Filter chapters</span>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResourceManager
        key={`chapter-manager-${refreshKey}-${selectedChild}`}
        title="Chapters"
        singular="Chapter"
        table="chapter"
        description="Chapters with subject, parent hierarchy, and sort order."
        filters={resourceFilters}
        initialValues={{ subject_id: selectedSubject, parent_id: selectedParent, title: "", sort: "" }}
        disabledFields={["subject_id"]}
        fields={[
          { key: "subject_id", label: "Subject", placeholder: "Select subject", type: "select", options: subjects, asNumber: true },
          { key: "title", label: "Title", placeholder: "Chapter title" },
          { key: "parent_id", label: "Parent", placeholder: "Optional parent chapter", type: "select", options: parentChapters, asNumber: true },
          { key: "sort", label: "Sort Order", placeholder: "0", type: "number" },
        ]}
        displayFields={[
          { key: "title", label: "Title" },
          { key: "parent_id", label: "Parent ID" },
          { key: "sort", label: "Sort Order" },
        ]}
      />
    </div>
  );
}
