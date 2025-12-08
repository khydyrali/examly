"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null };

export default function QuizPage() {
  const { supabase } = useSupabase();
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [parentChapters, setParentChapters] = useState<Option[]>([]);
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [years, setYears] = useState<Option[]>([]);
  const [seasons, setSeasons] = useState<Option[]>([]);
  const [papers, setPapers] = useState<Option[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedPaper, setSelectedPaper] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const router = useRouter();

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
      const [{ data: subjectData }, { data: chapterData }, { data: yearData }, { data: seasonData }, { data: paperData }] = await Promise.all([
        supabase.from("subject").select("id, name, code").order("name", { ascending: true }),
        supabase.from("chapter").select("id, title, parent_id").order("title", { ascending: true }),
        supabase.from("year").select("id, name").order("name", { ascending: true }),
        supabase.from("season").select("id, name").order("name", { ascending: true }),
        supabase.from("paper").select("id, name").order("name", { ascending: true }),
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
      setYears((yearData ?? []).map((y) => ({ label: y.name ?? String(y.id), value: y.name ?? String(y.id) })));
      setSeasons((seasonData ?? []).map((s) => ({ label: s.name ?? String(s.id), value: String(s.id) })));
      setPapers((paperData ?? []).map((p) => ({ label: p.name ?? String(p.id), value: p.name ?? String(p.id) })));

      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        setSelectedSubjectName(match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
      }
    };
    void load();
  }, [supabase, selectedSubject]);

  const childChapters = useMemo(
    () =>
      chapters
        .filter((c) => (selectedParent ? c.parent_id === Number(selectedParent) : !!c.parent_id))
        .map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) })),
    [chapters, selectedParent],
  );

  const filters = useMemo(() => {
    const list: { column: string; value: string | number | null }[] = [
      { column: "subject_id", value: Number(selectedSubject) },
      selectedChild ? { column: "chapter_id", value: Number(selectedChild) } : { column: "chapter_id", value: null },
    ];

    if (selectedYear) list.push({ column: "year", value: selectedYear });
    if (selectedSeason) list.push({ column: "season_id", value: Number(selectedSeason) });
    if (selectedPaper) list.push({ column: "paper", value: selectedPaper });
    return list;
  }, [selectedChild, selectedPaper, selectedSeason, selectedSubject, selectedYear]);

  const orderBy = useMemo(
    () => [{ column: "id", ascending: sortOrder === "asc" ? true : false }],
    [sortOrder],
  );

  if (!selectedSubject) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Quizzes</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Manage {selectedSubjectName ? `${selectedSubjectName} quizzes` : "quiz records"}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Create and edit quiz questions and MCQ options.</p>
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
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Year</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Season</span>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="">All seasons</option>
            {seasons.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Paper</span>
          <select
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="">All papers</option>
            {papers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Sort</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value === "asc" ? "asc" : "desc")}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      </div>
      <ResourceManager
        title="Quizzes"
        singular="Quiz"
        table="quiz"
        orderBy={orderBy}
        select="*, chapter:chapter_id(title), season:season_id(name)"
        searchColumns={["question", "mcq1", "mcq2", "mcq3", "mcq4", "mcq_answer"]}
        description="Store quiz prompts and MCQs."
        filters={filters}
        initialValues={{ subject_id: selectedSubject, chapter_id: selectedChild }}
        disabledFields={["subject_id"]}
        fields={[
          { key: "chapter_id", label: "Chapter", placeholder: "Select chapter", type: "select", options: childChapters, asNumber: true },
          { key: "subject_id", label: "Subject", placeholder: "Select subject", type: "select", options: subjects, asNumber: true },
          { key: "question", label: "Question", placeholder: "Enter question text", type: "richtext", colSpan: 4, editorMinHeight: 200 },
          { key: "mcq1", label: "MCQ A", placeholder: "Option A", type: "textarea" },
          { key: "mcq2", label: "MCQ B", placeholder: "Option B", type: "textarea" },
          { key: "mcq3", label: "MCQ C", placeholder: "Option C", type: "textarea" },
          { key: "mcq4", label: "MCQ D", placeholder: "Option D", type: "textarea" },
          {
            key: "mcq_answer",
            label: "MCQ Answer",
            placeholder: "Select correct option",
            type: "select",
            options: [
              { label: "A", value: "A" },
              { label: "B", value: "B" },
              { label: "C", value: "C" },
              { label: "D", value: "D" },
            ],
          },
          { key: "mark_scheme", label: "Mark Scheme", placeholder: "Grading notes", type: "richtext", colSpan: 4, editorMinHeight: 200 },
          { key: "max_score", label: "Max Score", placeholder: "e.g. 5", type: "number" },
          { key: "num", label: "Number", placeholder: "Question number" },
          { key: "year", label: "Year", placeholder: "Select year", type: "select", options: years },
          { key: "season_id", label: "Season", placeholder: "Select season", type: "select", options: seasons, asNumber: true },
          { key: "paper", label: "Paper", placeholder: "Select paper", type: "select", options: papers },
        ]}
        displayFields={[
          { key: "num", label: "Q#", columnClassName: "w-12" },
          { key: "chapter", label: "Chapter", columnClassName: "w-40", render: (item) => (item.chapter as { title?: string } | undefined)?.title ?? "" },
          {
            key: "exam_meta",
            label: "Exam",
            columnClassName: "w-40 whitespace-nowrap",
            render: (item) => {
              const seasonName = (item.season as { name?: string } | undefined)?.name;
              const seasonValue = seasonName || item.season_id || "";
              const year = item.year || "";
              const paper = item.paper || "";

              const parts = [year, seasonValue, paper].filter(Boolean);
              return parts.join(" • ");
            },
          },
          {
            key: "question",
            label: "Question",
            columnClassName: "w-2/5 max-w-[520px] whitespace-pre-wrap break-words overflow-hidden max-h-24",
          },
          { key: "mcq1", label: "MCQ A", columnClassName: "max-w-[260px] whitespace-pre-wrap break-words overflow-hidden max-h-20" },
          { key: "mcq2", label: "MCQ B", columnClassName: "max-w-[260px] whitespace-pre-wrap break-words overflow-hidden max-h-20" },
          { key: "mcq3", label: "MCQ C", columnClassName: "max-w-[260px] whitespace-pre-wrap break-words overflow-hidden max-h-20" },
          { key: "mcq4", label: "MCQ D", columnClassName: "max-w-[260px] whitespace-pre-wrap break-words overflow-hidden max-h-20" },
          { key: "mcq_answer", label: "Answer", columnClassName: "w-16 font-semibold" },
        ]}
      />
    </div>
  );
}
