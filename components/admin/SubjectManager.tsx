/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "../providers/SupabaseProvider";

type Subject = {
  id: number;
  subject_program_id: number;
  code: string;
  name: string;
  image: string | null;
  description: string | null;
  sort: number;
  is_deleted: boolean;
};

type Program = { id: number; name: string | null };

type FormState = {
  subject_program_id: string;
  code: string;
  name: string;
  image: string;
  description: string;
  sort: string;
  is_deleted: string;
};

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_SUBJECT_BUCKET || "main";
const FOLDER = process.env.NEXT_PUBLIC_SUPABASE_SUBJECT_FOLDER || "logo";

export function SubjectManager() {
  const { supabase } = useSupabase();
  const [items, setItems] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initialForm = useMemo<FormState>(
    () => ({
      subject_program_id: "",
      code: "",
      name: "",
      image: "",
      description: "",
      sort: "0",
      is_deleted: "false",
    }),
    [],
  );
  const [form, setForm] = useState<FormState>(initialForm);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const [{ data, error: fetchError }, { data: programData }] = await Promise.all([
      supabase
        .from("subject")
        .select("id, subject_program_id, code, name, image, description, sort, is_deleted")
        .order("created_at", { ascending: false }),
      supabase.from("program").select("id, name").order("name", { ascending: true }),
    ]);
    if (fetchError) {
      setError(fetchError.message);
      setItems([]);
    } else {
      setItems((data as Subject[]) ?? []);
    }
    setPrograms(programData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchItems();
  }, [fetchItems]);

  const programLookup = useMemo(() => {
    const map = new Map<number, string>();
    programs.forEach((p) => map.set(p.id, p.name ?? `Program ${p.id}`));
    return map;
  }, [programs]);

  const openAdd = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (item: Subject) => {
    setForm({
      subject_program_id: String(item.subject_program_id ?? ""),
      code: item.code ?? "",
      name: item.name ?? "",
      image: item.image ?? "",
      description: item.description ?? "",
      sort: String(item.sort ?? 0),
      is_deleted: item.is_deleted ? "true" : "false",
    });
    setEditingId(item.id);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setError(null);
    setEditingId(null);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const path = `${FOLDER}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setForm((prev) => ({ ...prev, image: data.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      subject_program_id: form.subject_program_id === "" ? null : Number(form.subject_program_id),
      code: form.code || null,
      name: form.name || null,
      image: form.image || null,
      description: form.description || null,
      sort: form.sort === "" ? 0 : Number(form.sort),
      is_deleted: form.is_deleted === "true",
    };

    if (editingId) {
      const { error: updateError } = await supabase.from("subject").update(payload).eq("id", editingId);
      if (updateError) {
        setError(updateError.message);
      } else {
        await fetchItems();
        closeDialog();
      }
    } else {
      const { error: insertError } = await supabase.from("subject").insert([payload]);
      if (insertError) {
        setError(insertError.message);
      } else {
        await fetchItems();
        closeDialog();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    const { error: deleteError } = await supabase.from("subject").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setItems((prev) => prev.filter((s) => s.id !== id));
    }
    setSaving(false);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Subjects</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage subjects and images.</p>
        </div>
        <button onClick={openAdd} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
          Add Subject
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Program</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-neutral-950">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Loading subjects…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    No subjects yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-12 w-12 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-center text-xs text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {programLookup.get(item.subject_program_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDialog ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{editingId ? "Edit subject" : "Add subject"}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload an image and fill details.</p>
              </div>
              <button onClick={closeDialog} className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800">
                ✕
              </button>
            </div>

            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">Program</span>
                <select
                  value={form.subject_program_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject_program_id: e.target.value }))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                >
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || `Program ${p.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">Code</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  placeholder="Subject code"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  placeholder="Subject name"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  placeholder="Short description"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">Sort</span>
                <input
                  type="number"
                  value={form.sort}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort: e.target.value }))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                  placeholder="0"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={form.is_deleted === "true"}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_deleted: e.target.checked ? "true" : "false" }))}
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">Is Deleted</span>
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Image (uploads to bucket &quot;{BUCKET}&quot; folder &quot;{FOLDER}&quot;)
                </p>
                {form.image ? (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.image} alt="Subject" className="h-16 w-16 rounded-md object-cover" />
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
                <div className="mt-2 flex flex-col gap-2 text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadImage(file);
                      }
                    }}
                  />
                  {uploading ? <span className="text-xs text-gray-500">Uploading...</span> : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeDialog}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
