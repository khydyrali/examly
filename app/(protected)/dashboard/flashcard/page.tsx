"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null };

export default function FlashcardPage() {
  const { supabase } = useSupabase();
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [parentChapters, setParentChapters] = useState<Option[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("subject_id") : null;
    if (!stored) {
      alert("Please select a subject first."); // light guard for now
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
        supabase.from("chapter").select("id, title, parent_id").order("title", { ascending: true }),
      ]);
      setSubjects(
        (subjectData ?? []).map((s) => ({
          label: s.code ? `${s.code} - ${s.name ?? ""}`.trim() : s.name ?? String(s.id),
          value: String(s.id),
        })),
      );
      const chapterRows = (chapterData as ChapterRow[]) ?? [];
      setChapters(chapterRows);
      const parents = chapterRows.filter((c) => !c.parent_id).map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) }));
      setParentChapters(parents);
    };
    void load();
  }, [supabase, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) return;
    const match = subjects.find((s) => s.value === selectedSubject);
    if (match) {
      setSelectedSubjectName(match.label);
    }
  }, [selectedSubject, subjects]);

  const childChapters = useMemo(
    () =>
      chapters
        .filter((c) => (selectedParent ? c.parent_id === Number(selectedParent) : !!c.parent_id))
        .map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) })),
    [chapters, selectedParent],
  );

  if (!selectedSubject) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Flashcards</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Manage {selectedSubjectName ? `${selectedSubjectName} flashcards` : "flashcards"}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Create and edit flashcards by subject and chapter.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Parent chapter</span>
          <select
            value={selectedParent}
            onChange={(e) => {
              setSelectedParent(e.target.value);
              setSelectedChild("");
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="">Select parent</option>
            {parentChapters.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Child chapter</span>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="">All child chapters</option>
            {childChapters.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ResourceManager
        title="Flashcards"
        singular="Flashcard"
        table="flashcard"
        description="Front/back flashcards with optional subject and chapter."
        filters={[
          { column: "subject_id", value: Number(selectedSubject) },
          selectedChild ? { column: "chapter_id", value: Number(selectedChild) } : { column: "chapter_id", value: null },
        ]}
        initialValues={{ subject_id: selectedSubject, chapter_id: selectedChild }}
        disabledFields={["subject_id"]}
        fieldGridClassName="mt-4 grid gap-3 sm:grid-cols-2"
        fields={[
          { key: "subject_id", label: "Subject", placeholder: "Select subject", type: "select", options: subjects, asNumber: true },
          { key: "chapter_id", label: "Chapter", placeholder: "Select chapter", type: "select", options: childChapters, asNumber: true },
          { key: "front", label: "Front", placeholder: "Question / prompt", type: "richtext", colSpan: 2, editorMinHeight: 200 },
          { key: "back", label: "Back", placeholder: "Answer", type: "richtext", colSpan: 2, editorMinHeight: 200 },
        ]}
        displayFields={[
          {
            key: "front",
            label: "Front",
            columnClassName: "max-w-[360px] whitespace-pre-wrap break-words overflow-hidden max-h-24",
          },
          {
            key: "back",
            label: "Back",
            columnClassName: "max-w-[360px] whitespace-pre-wrap break-words overflow-hidden max-h-24",
          },
        ]}
      />
    </div>
  );
}
