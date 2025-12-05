'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';
import { RichTextEditor } from '../ui/RichTextEditor';

type FieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'richtext' | 'select';
  options?: { label: string; value: string }[];
  asNumber?: boolean;
  columnClassName?: string;
  colSpan?: 1 | 2 | 3 | 4;
  disabled?: boolean;
  editorMinHeight?: number;
};

type Resource = {
  id: string | number;
  created_at?: string;
} & Record<string, string | number | boolean | null | undefined>;

type Filter =
  | { column: string; value: string | number | null | undefined }
  | { or: string };

type Props = {
  title: string;
  singular?: string;
  table: string;
  fields: FieldConfig[];
  displayFields?: FieldConfig[];
  description?: string;
  filters?: Filter[];
  initialValues?: Record<string, string>;
  disabledFields?: string[];
  fieldGridClassName?: string;
  dialogClassName?: string;
};

export function ResourceManager({
  title,
  singular,
  table,
  fields,
  displayFields,
  description,
  filters,
  initialValues,
  disabledFields,
  fieldGridClassName,
  dialogClassName,
}: Props) {
  const { supabase } = useSupabase();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const bodyOverflow = useRef<string | undefined>();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const initialForm = useMemo(
    () =>
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = initialValues?.[field.key] ?? '';
        return acc;
      }, {}),
    [fields, initialValues],
  );
  const [form, setForm] = useState<Record<string, string>>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  // Reset pagination when filters change.
  const filterKey = JSON.stringify(filters ?? []);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const searchFilter = useMemo(() => {
    if (!search.trim()) return null;
    const searchable = fields
      .filter((f) => f.type !== 'number' && f.type !== 'checkbox')
      .map((f) => `${f.key}.ilike.%${search}%`);
    return searchable.length ? searchable.join(',') : null;
  }, [fields, search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const hasSort = fields.some((f) => f.key === 'sort');
    let query = supabase.from(table).select('*', { count: 'exact' });
    query = hasSort ? query.order('sort', { ascending: true }).order('created_at', { ascending: false }) : query.order('created_at', { ascending: false });
    query = query.range(from, to);
    (filters ?? []).forEach((f) => {
      if ("or" in f) {
        query = query.or(f.or);
      } else if (f.value === "__NULL__") {
        query = query.is(f.column, null);
      } else if (f.value !== null && f.value !== undefined && f.value !== "") {
        query = query.eq(f.column, f.value);
      }
    });
    if (searchFilter) {
      query = query.or(searchFilter);
    }

    const { data, error: fetchError, count } = await query;
    if (fetchError) {
      setError(fetchError.message);
      setItems([]);
      setTotalCount(0);
    } else {
      setItems(data ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [page, pageSize, searchFilter, supabase, table, filterKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchItems();
  }, [fetchItems]);

  // Prevent background scroll when dialog is open.
  useEffect(() => {
    if (showDialog) {
      bodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (bodyOverflow.current !== undefined) {
      document.body.style.overflow = bodyOverflow.current;
      bodyOverflow.current = undefined;
    }
    return () => {
      if (bodyOverflow.current !== undefined) {
        document.body.style.overflow = bodyOverflow.current;
        bodyOverflow.current = undefined;
      }
    };
  }, [showDialog]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (item: Resource) => {
    const nextForm = { ...initialForm };
    fields.forEach((field) => {
      const value = item[field.key];
      nextForm[field.key] = value === null || value === undefined ? '' : String(value);
    });
    setForm(nextForm);
    setEditingId(String(item.id));
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload = fields.reduce<Record<string, string | number | boolean | null>>((acc, field) => {
      const raw = form[field.key];
      if (field.type === 'number' || (field.type === 'select' && field.asNumber)) {
        acc[field.key] = raw === '' ? null : Number(raw);
      } else if (field.type === 'checkbox') {
        acc[field.key] = raw === 'true';
      } else {
        acc[field.key] = raw === '' ? null : raw;
      }
      return acc;
    }, {});

    if (editingId) {
      const { error: updateError } = await supabase.from(table).update(payload).eq('id', editingId);
      if (updateError) {
        setError(updateError.message);
      } else {
        await fetchItems();
        closeDialog();
      }
    } else {
      const { error: insertError } = await supabase.from(table).insert([payload]);
      if (insertError) {
        setError(insertError.message);
      } else {
        await fetchItems();
        closeDialog();
      }
    }

    setSaving(false);
  };

  const handleEdit = (item: Resource) => {
    openEditDialog(item);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setItems((prev) => prev.filter((item) => String(item.id) !== id));
      setTotalCount((c) => Math.max(0, c - 1));
    }
    setSaving(false);
  };

  const handleUploadImage = useCallback(
    async (file: File) => {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage.from('public').upload(`richtext/${filename}`, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) {
        setError(uploadError.message);
        return null;
      }
      const { data: publicData } = supabase.storage.from('public').getPublicUrl(data.path);
      return publicData?.publicUrl ?? null;
    },
    [supabase],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const tableFields = displayFields && displayFields.length > 0 ? displayFields : fields;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-neutral-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
          {description ? <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Filter..."
            className="w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
          />
          <button
            onClick={openAddDialog}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Add {singular ?? title.replace(/s$/, '')}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-neutral-900">
              <tr>
                {tableFields.map((field) => (
                  <th
                    key={field.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 ${field.columnClassName ?? ''}`}
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-neutral-950">
              {loading ? (
                <tr>
                  <td colSpan={fields.length + 1} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Loading {title.toLowerCase()}...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    No {title.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    {tableFields.map((field) => (
                      <td
                        key={field.key}
                        className={`px-4 py-3 align-top text-sm text-gray-800 dark:text-gray-100 ${field.columnClassName ?? ''}`}
                      >
                        {field.type === 'checkbox' ? (item[field.key] ? 'Yes' : 'No') : item[field.key] ?? ''}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(String(item.id))}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-neutral-900 dark:text-gray-200">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-950"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{totalCount} total</div>
        </div>
      </div>

      {showDialog
        ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
            onClick={(e) => {
              if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                closeDialog();
              }
            }}
          >
            <div
              ref={dialogRef}
              className={`relative mt-4 w-full ${dialogClassName ?? "max-w-4xl"} rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-neutral-950`}
            >
              <div className="max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {editingId ? 'Edit' : 'Add'} {singular ?? title.replace(/s$/, '')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fill out the fields and save.</p>
                </div>
                <button
                  onClick={closeDialog}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-600 shadow-sm transition hover:scale-105 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:border-gray-600"
                  aria-label="Close dialog"
                >
                  &times;
                </button>
              </div>

              <div className={fieldGridClassName ?? "mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}>
                {fields.map((field) => {
                  const span =
                    field.colSpan === 4
                      ? 'sm:col-span-2 md:col-span-3 lg:col-span-4'
                      : field.colSpan === 3
                        ? 'sm:col-span-2 md:col-span-3'
                        : field.colSpan === 2
                          ? 'sm:col-span-2'
                          : '';
                  return (
                    <label key={field.key} className={`flex flex-col gap-1 text-sm ${span}`}>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="min-h-[96px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                        value={form[field.key]}
                        disabled={disabledFields?.includes(field.key) || field.disabled}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'richtext' ? (
                      <RichTextEditor
                        value={form[field.key]}
                        onChange={(val) => setForm((prev) => ({ ...prev, [field.key]: val }))}
                        placeholder={field.placeholder}
                        minHeight={field.editorMinHeight}
                        onUploadImage={handleUploadImage}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                        value={form[field.key]}
                        disabled={disabledFields?.includes(field.key) || field.disabled}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      >
                        <option value="">{field.placeholder ?? 'Select...'}</option>
                        {(field.options ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={form[field.key] === 'true'}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.checked ? 'true' : 'false' }))}
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        inputMode={field.type === 'number' ? 'numeric' : 'text'}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-50"
                        value={form[field.key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                    </label>
                  );
                })}
              </div>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeDialog}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </section>
  );
}
