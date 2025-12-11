"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

type Option = { label: string; value: string };
type ChapterRow = { id: number; title: string | null; parent_id: number | null };

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
  question: string | null;
  num: string | null;
  chapter_id: number | null;
  mark_scheme: string | null;
  max_score: number | null;
};

export default function QuizFrqPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [parentChapters, setParentChapters] = useState<Option[]>([]);
  const [selectedParentChapter, setSelectedParentChapter] = useState<string>("");
  const [selectedChildChapter, setSelectedChildChapter] = useState<string>("");
  const [years, setYears] = useState<Option[]>([]);
  const [seasons, setSeasons] = useState<Option[]>([]);
  const [papers, setPapers] = useState<Option[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedPaper, setSelectedPaper] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");

  const [parents, setParents] = useState<ParentRow[]>([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [parentTotal, setParentTotal] = useState(0);
  const [parentPage, setParentPage] = useState(1);
  const parentPageSize = 10;
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const [children, setChildren] = useState<ChildRow[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  const [parentQuestion, setParentQuestion] = useState<string>("");
  const [parentChapterId, setParentChapterId] = useState<string>("");
  const [parentMaxScore, setParentMaxScore] = useState<string>("");
  const [parentNum, setParentNum] = useState<string>("");
  const [parentFormYear, setParentFormYear] = useState<string>("");
  const [parentFormSeason, setParentFormSeason] = useState<string>("");
  const [parentFormPaper, setParentFormPaper] = useState<string>("");
  const [parentError, setParentError] = useState<string | null>(null);
  const [parentSaving, setParentSaving] = useState(false);
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [editingParentId, setEditingParentId] = useState<number | null>(null);

  const [childQuestion, setChildQuestion] = useState<string>("");
  const [childNum, setChildNum] = useState<string>("");
  const [childMarkScheme, setChildMarkScheme] = useState<string>("");
  const [childMaxScore, setChildMaxScore] = useState<string>("");
  const [childError, setChildError] = useState<string | null>(null);
  const [childSaving, setChildSaving] = useState(false);
  const [showChildDialog, setShowChildDialog] = useState(false);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);

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
        supabase
          .from("chapter")
          .select("id, title, parent_id")
          .eq("subject_id", Number(selectedSubject))
          .order("title", { ascending: true }),
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
      setParentChapters(chapterRows.filter((c) => !c.parent_id).map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) })));

      setYears((yearData ?? []).map((y) => ({ label: y.name ?? String(y.id), value: y.name ?? String(y.id) })));
      setSeasons((seasonData ?? []).map((s) => ({ label: s.name ?? String(s.id), value: String(s.id) })));
      setPapers((paperData ?? []).map((p) => ({ label: p.name ?? String(p.id), value: p.name ?? String(p.id) })));

      const match = (subjectData ?? []).find((s) => String(s.id) === selectedSubject);
      if (match) {
        setSelectedSubjectName(match.code ? `${match.code} - ${match.name ?? ""}`.trim() : match.name ?? String(match.id));
      }
    };
    void load();
  }, [selectedSubject, supabase]);

  const childChapters = useMemo(
    () =>
      chapters
        .filter((c) => (selectedParentChapter ? c.parent_id === Number(selectedParentChapter) : !!c.parent_id))
        .map((c) => ({ label: c.title ?? String(c.id), value: String(c.id) })),
    [chapters, selectedParentChapter],
  );

  const parentFilters = useMemo(() => {
    const filters: { column: string; value: string | number | null | "__NULL__" }[] = [
      { column: "subject_id", value: selectedSubject ? Number(selectedSubject) : null },
      { column: "parent_id", value: "__NULL__" },
    ];
    if (selectedChildChapter) filters.push({ column: "chapter_id", value: Number(selectedChildChapter) });
    if (selectedYear) filters.push({ column: "year", value: selectedYear });
    if (selectedSeason) filters.push({ column: "season_id", value: Number(selectedSeason) });
    if (selectedPaper) filters.push({ column: "paper", value: selectedPaper });
    return filters;
  }, [selectedChildChapter, selectedPaper, selectedSeason, selectedSubject, selectedYear]);

  const chapterLookup = useMemo(() => {
    const map = new Map<number, string>();
    chapters.forEach((c) => map.set(c.id, c.title ?? String(c.id)));
    return map;
  }, [chapters]);

  const seasonLookup = useMemo(() => {
    const map = new Map<number, string>();
    seasons.forEach((s) => map.set(Number(s.value), s.label));
    return map;
  }, [seasons]);

  const fetchParents = async () => {
    if (!selectedSubject) return;
    setParentsLoading(true);
    const from = (parentPage - 1) * parentPageSize;
    const to = from + parentPageSize - 1;
    let query = supabase
      .from("quiz_frq")
      .select("id, question, num, year, season_id, paper, chapter_id, mark_scheme, max_score", { count: "exact" })
      .eq("subject_id", Number(selectedSubject))
      .is("parent_id", null);
    parentFilters.forEach((f) => {
      if (f.value === "__NULL__") {
        query = query.is(f.column, null);
      } else if (f.value !== null && f.value !== undefined && f.value !== "") {
        query = query.eq(f.column, f.value);
      }
    });
    query = query.order("id", { ascending: sortOrder === "asc" });
    const { data, error, count } = await query.range(from, to);
    if (!error && Array.isArray(data)) {
      setParents(data as ParentRow[]);
      setParentTotal(count ?? 0);
      const ids = new Set((data as ParentRow[]).map((p) => p.id));
      if (!selectedParentId && data.length > 0) {
        setSelectedParentId(data[0].id);
      } else if (selectedParentId && !ids.has(selectedParentId) && data.length > 0) {
        setSelectedParentId(data[0].id);
      }
    }
    setParentsLoading(false);
  };

  const fetchChildren = async (parentId: number | null) => {
    if (!parentId) {
      setChildren([]);
      return;
    }
    setChildrenLoading(true);
    const { data, error } = await supabase
      .from("quiz_frq")
      .select("id, question, num, chapter_id, mark_scheme, max_score")
      .eq("parent_id", parentId)
      .order("id", { ascending: true });
    if (!error && Array.isArray(data)) {
      setChildren(data as ChildRow[]);
    }
    setChildrenLoading(false);
  };

  useEffect(() => {
    void fetchParents();
  }, [sortOrder, parentFilters, parentPage]);

  useEffect(() => {
    setParentPage(1);
  }, [parentFilters]);

  useEffect(() => {
    void fetchChildren(selectedParentId);
  }, [selectedParentId]);

  const openAddParent = () => {
    setShowParentDialog(true);
    setEditingParentId(null);
    setParentError(null);
    setParentQuestion("");
    setParentChapterId(selectedChildChapter);
    setParentMaxScore("");
    setParentNum("");
    setParentFormYear(selectedYear);
    setParentFormSeason(selectedSeason);
    setParentFormPaper(selectedPaper);
  };

  const saveParent = async () => {
    if (!selectedSubject) {
      setParentError("Select a subject first.");
      return;
    }
    if (!parentQuestion.trim()) {
      setParentError("Parent question is required.");
      return;
    }
    setParentSaving(true);
    setParentError(null);
    const payload = {
      subject_id: Number(selectedSubject),
      chapter_id: parentChapterId ? Number(parentChapterId) : null,
      parent_id: null as null,
      question: parentQuestion,
      max_score: parentMaxScore ? Number(parentMaxScore) : null,
      num: parentNum || null,
      year: parentFormYear || null,
      season_id: parentFormSeason ? Number(parentFormSeason) : null,
      paper: parentFormPaper || null,
    };
    if (editingParentId) {
      const { error } = await supabase.from("quiz_frq").update(payload).eq("id", editingParentId);
      if (error) {
        setParentError(error.message);
        setParentSaving(false);
        return;
      }
      setSelectedParentId(editingParentId);
    } else {
      const { data, error } = await supabase.from("quiz_frq").insert([payload]).select("id").maybeSingle();
      if (error || !data) {
        setParentError(error?.message ?? "Could not create parent question.");
        setParentSaving(false);
        return;
      }
      setSelectedParentId((data as { id: number }).id);
    }
    setParentQuestion("");
    setParentChapterId(selectedChildChapter);
    setParentMaxScore("");
    setParentNum("");
    setParentFormYear(selectedYear);
    setParentFormSeason(selectedSeason);
    setParentFormPaper(selectedPaper);
    await fetchParents();
    setShowParentDialog(false);
    setParentSaving(false);
  };

  const handleEditParent = (row: ParentRow) => {
    setEditingParentId(row.id);
    setParentQuestion(row.question ?? "");
    setParentChapterId(row.chapter_id ? String(row.chapter_id) : "");
    setParentMaxScore(row.max_score ? String(row.max_score) : "");
    setParentNum(row.num ?? "");
    setParentFormYear(row.year ?? "");
    setParentFormSeason(row.season_id ? String(row.season_id) : "");
    setParentFormPaper(row.paper ?? "");
    setParentError(null);
    setShowParentDialog(true);
  };

  const handleCreateChild = () => {
    setShowChildDialog(true);
    setEditingChildId(null);
    setChildQuestion("");
    setChildNum("");
    setChildMarkScheme("");
    setChildMaxScore("");
    setChildError(null);
  };

  const saveChild = async () => {
    if (!selectedParentId) {
      setChildError("Select a parent question first.");
      return;
    }
    if (!selectedSubject) {
      setChildError("Select a subject first.");
      return;
    }
    if (!childQuestion.trim()) {
      setChildError("Child question is required.");
      return;
    }
    const parentChapterId = parents.find((p) => p.id === selectedParentId)?.chapter_id ?? null;
    setChildSaving(true);
    setChildError(null);
    const payload = {
      subject_id: Number(selectedSubject),
      chapter_id: parentChapterId,
      parent_id: selectedParentId,
      question: childQuestion,
      mark_scheme: childMarkScheme || null,
      max_score: childMaxScore ? Number(childMaxScore) : null,
      num: childNum || null,
      year: selectedYear || null,
      season_id: selectedSeason ? Number(selectedSeason) : null,
      paper: selectedPaper || null,
    };
    if (editingChildId) {
      const { error } = await supabase.from("quiz_frq").update(payload).eq("id", editingChildId);
      if (error) {
        setChildError(error.message);
        setChildSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("quiz_frq").insert([payload]);
      if (error) {
        setChildError(error.message);
        setChildSaving(false);
        return;
      }
    }
    setChildQuestion("");
    setChildMarkScheme("");
    setChildMaxScore("");
    setChildNum("");
    await fetchChildren(selectedParentId);
    setShowChildDialog(false);
    setChildSaving(false);
  };

  const handleEditChild = (row: ChildRow) => {
    setEditingChildId(row.id);
    setChildQuestion(row.question ?? "");
    setChildNum(row.num ?? "");
    setChildMarkScheme(row.mark_scheme ?? "");
    setChildMaxScore(row.max_score ? String(row.max_score) : "");
    setChildError(null);
    setShowChildDialog(true);
  };

  if (!selectedSubject) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Quiz FRQ</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Parent & child FRQ manager</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Left: parent FRQ prompts. Right: child FRQ sub-questions linked to the selected parent.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-neutral-950/70">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">Parent chapter</span>
            <select
              value={selectedParentChapter}
              onChange={(e) => {
                setSelectedParentChapter(e.target.value);
                setSelectedChildChapter("");
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
              value={selectedChildChapter}
              onChange={(e) => setSelectedChildChapter(e.target.value)}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-neutral-950/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Parents</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Parent questions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Listed rows show only parent prompts.</p>
            </div>
            <button
              type="button"
              onClick={openAddParent}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Add parent
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200">
              <span>Parent list</span>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span>
                  Showing {parents.length} / {parentTotal}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setParentPage((p) => Math.max(1, p - 1))}
                    disabled={parentPage === 1 || parentsLoading}
                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-neutral-800"
                  >
                    Prev
                  </button>
                  <span>
                    Page {parentPage} / {Math.max(1, Math.ceil(parentTotal / parentPageSize))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParentPage((p) => p + 1)}
                    disabled={parentsLoading || parentPage * parentPageSize >= parentTotal}
                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-neutral-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
            <div className="max-h-[420px] divide-y divide-gray-200 overflow-y-auto dark:divide-gray-800">
              {parentsLoading ? (
                <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Loading parents...</p>
              ) : parents.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">No parent questions yet.</p>
              ) : (
                parents.map((p) => {
                  const active = p.id === selectedParentId;
                  const chapterLabel = p.chapter_id ? chapterLookup.get(p.chapter_id) : "";
                  const seasonLabel = p.season_id ? seasonLookup.get(p.season_id) : "";
                  const metaLine1 = [
                    p.num ? `Q${p.num}` : "",
                    chapterLabel ? `Chapter: ${chapterLabel}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  const metaLine2 = `Year: ${p.year || "?"} · Season: ${seasonLabel || "?"} · Paper: ${p.paper || "?"}`;
                  return (
                    <div
                      key={p.id}
                      className={`px-4 py-3 text-left transition ${
                        active
                          ? "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                          : "hover:bg-gray-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <div className="flex-1">
                          <button type="button" onClick={() => setSelectedParentId(p.id)} className="flex w-full flex-col text-left">
                            <span className="truncate">{p.question ? p.question.replace(/<[^>]+>/g, "").slice(0, 80) : "Untitled"}</span>
                            <span className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                              {metaLine1 || "Chapter: ?"}
                            </span>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{metaLine2}</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditParent(p)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-neutral-950/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Children</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Sub-questions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Linked to the selected parent.</p>
            </div>
            <button
              type="button"
              onClick={handleCreateChild}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Add child
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200">
              <span>Child list</span>
              <span>{children.length} total</span>
            </div>
            <div className="max-h-[420px] divide-y divide-gray-200 overflow-y-auto dark:divide-gray-800">
              {childrenLoading ? (
                <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Loading child questions...</p>
              ) : !selectedParentId ? (
                <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Select a parent to view child questions.</p>
              ) : children.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">No child questions for this parent yet.</p>
              ) : (
                children.map((c) => (
                  <div key={c.id} className="px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-50">
                      <span>{c.num ? `(${c.num})` : ""}</span>
                      <button
                        type="button"
                        onClick={() => handleEditChild(c)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                      >
                        Edit
                      </button>
                    </div>
                    <div
                      className="mt-1 text-sm text-gray-800 dark:text-gray-200"
                      dangerouslySetInnerHTML={{ __html: c.question ?? "" }}
                    />
                    {c.mark_scheme ? (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Mark scheme: </span>
                        <div
                          className="mt-1 text-gray-700 dark:text-gray-200"
                          dangerouslySetInnerHTML={{ __html: c.mark_scheme }}
                        />
                      </div>
                    ) : null}
                    {c.max_score ? <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Max score: {c.max_score}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showParentDialog ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div className="mt-6 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{editingParentId ? "Edit parent question" : "Add parent question"}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parent rows appear in the left list.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowParentDialog(false)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveParent}
                  disabled={parentSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {parentSaving ? "Saving..." : editingParentId ? "Update parent" : "Add parent"}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">Parent question</span>
                <RichTextEditor
                  value={parentQuestion}
                  onChange={setParentQuestion}
                  placeholder="Enter the main FRQ prompt..."
                  minHeight={140}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Chapter</span>
                  <select
                    value={parentChapterId}
                    onChange={(e) => setParentChapterId(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  >
                    <option value="">Select chapter</option>
                    {childChapters.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Question number</span>
                  <input
                    value={parentNum}
                    onChange={(e) => setParentNum(e.target.value)}
                    placeholder="e.g. 1"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Year</span>
                  <input
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="e.g. 2024"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Season</span>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  >
                    <option value="">Select season</option>
                    {seasons.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Paper</span>
                  <input
                    value={selectedPaper}
                    onChange={(e) => setSelectedPaper(e.target.value)}
                    placeholder="e.g. 1"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Max score (optional)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={parentMaxScore}
                    onChange={(e) => setParentMaxScore(e.target.value)}
                    placeholder="e.g. 20"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  />
                </label>
              </div>

              {parentError ? <p className="text-sm text-red-600">{parentError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {showChildDialog ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div className="mt-6 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{editingChildId ? "Edit child question" : "Add child question"}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Linked to parent ID {selectedParentId ?? "?"}.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChildDialog(false)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChild}
                  disabled={childSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {childSaving ? "Saving..." : editingChildId ? "Update child" : "Add child"}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">Child question</span>
                <RichTextEditor
                  value={childQuestion}
                  onChange={setChildQuestion}
                  placeholder="Sub-question prompt..."
                  minHeight={140}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Chapter</span>
                  <span className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200">
                    Uses parent chapter
                  </span>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Number/label</span>
                  <input
                    value={childNum}
                    onChange={(e) => setChildNum(e.target.value)}
                    placeholder="e.g. (a)"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  />
                </label>
                <div className="sm:col-span-2 flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Mark scheme (optional)</span>
                  <RichTextEditor
                    value={childMarkScheme}
                    onChange={setChildMarkScheme}
                    placeholder="How to award points."
                    minHeight={120}
                  />
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Max score (optional)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={childMaxScore}
                    onChange={(e) => setChildMaxScore(e.target.value)}
                    placeholder="e.g. 5"
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-950 dark:text-gray-50"
                  />
                </label>
              </div>

              {childError ? <p className="text-sm text-red-600">{childError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
