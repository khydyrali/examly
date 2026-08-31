"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  content: string | null;
  status: "draft" | "published";
  view_count: number;
  created_at: string;
  published_at: string | null;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm = { title: "", slug: "", coverImage: "", content: "", status: "draft" as "draft" | "published" };

export default function TutorBlogManagePage() {
  const { supabase, session } = useSupabase();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchPosts = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("blog_post")
      .select("id, title, slug, cover_image, content, status, view_count, created_at, published_at")
      .eq("author_id", session.user.id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPosts((data as PostRow[]) ?? []);
    }
    setLoading(false);
  }, [session, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPosts();
  }, [fetchPosts]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
    setShowForm(true);
  };

  const openEdit = (post: PostRow) => {
    setForm({
      title: post.title,
      slug: post.slug,
      coverImage: post.cover_image ?? "",
      content: post.content ?? "",
      status: post.status,
    });
    setEditingId(post.id);
    setSlugTouched(true);
    setShowForm(true);
  };

  const uploadCoverImage = async (file: File) => {
    setUploading(true);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage.from("public").upload(`blog-covers/${filename}`, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data: publicData } = supabase.storage.from("public").getPublicUrl(data.path);
    setForm((prev) => ({ ...prev, coverImage: publicData?.publicUrl ?? "" }));
    setUploading(false);
  };

  const handleUploadInlineImage = useCallback(
    async (file: File) => {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage.from("public").upload(`richtext/${filename}`, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) return null;
      const { data: publicData } = supabase.storage.from("public").getPublicUrl(data.path);
      return publicData?.publicUrl ?? null;
    },
    [supabase],
  );

  const handleSave = async () => {
    if (!session || !form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const slug = form.slug.trim() || slugify(form.title);
    const payload = {
      author_id: session.user.id,
      title: form.title.trim(),
      slug,
      cover_image: form.coverImage || null,
      content: form.content,
      status: form.status,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("blog_post").update(payload).eq("id", editingId)
      : await supabase.from("blog_post").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setSaving(false);
    await fetchPosts();
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const { error: deleteError } = await supabase.from("blog_post").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Badge color="violet">
            <Newspaper className="h-3.5 w-3.5" /> My Blog
          </Badge>
          <h1 className="font-heading text-3xl font-extrabold text-ink">Share tips with your students.</h1>
          <p className="text-sm font-semibold text-ink-soft">Write a post, save it as a draft, or publish it right away.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> New post
        </Button>
      </div>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {loading ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading your posts…</Card>
      ) : posts.length === 0 ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">You haven&apos;t written any posts yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-bold text-ink">{post.title}</h3>
                <Badge color={post.status === "published" ? "teal" : "yellow"}>{post.status}</Badge>
              </div>
              <p className="text-xs font-semibold text-ink-soft">
                {post.view_count} views · {new Date(post.created_at).toLocaleDateString()}
              </p>
              <div className="mt-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(post)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-subtle bg-surface px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-subtle/40"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(post.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-violet-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="mt-4 w-full max-w-3xl rounded-3xl border-2 border-subtle bg-surface p-6 shadow-2xl">
            <h2 className="font-heading text-xl font-extrabold text-ink">{editingId ? "Edit post" : "New post"}</h2>

            <div className="mt-4 space-y-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-ink">Title</span>
                <input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
                  }}
                  className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
                  placeholder="5 tips for exam day"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-ink">URL slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  className="rounded-xl border-2 border-subtle bg-surface px-3 py-2.5 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
                  placeholder="5-tips-for-exam-day"
                />
              </label>

              <div className="flex flex-col gap-2 text-sm">
                <span className="font-bold text-ink">Cover image (optional)</span>
                {form.coverImage ? (
                  <div className="flex items-center gap-3">
                    <img src={form.coverImage} alt="Cover" className="h-16 w-24 rounded-lg object-cover" />
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600 hover:underline"
                      onClick={() => setForm((prev) => ({ ...prev, coverImage: "" }))}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadCoverImage(file);
                  }}
                />
                {uploading ? <span className="text-xs font-semibold text-ink-soft">Uploading…</span> : null}
              </div>

              <div className="flex flex-col gap-1 text-sm">
                <span className="font-bold text-ink">Content</span>
                <RichTextEditor
                  value={form.content}
                  onChange={(val) => setForm((prev) => ({ ...prev, content: val }))}
                  placeholder="Write your post…"
                  minHeight={260}
                  onUploadImage={handleUploadInlineImage}
                />
              </div>

              <label className="flex items-center gap-3 text-sm font-bold text-ink">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "draft" | "published" }))}
                  className="rounded-xl border-2 border-subtle bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border-2 border-subtle bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:bg-subtle/40"
              >
                Cancel
              </button>
              <Button onClick={() => void handleSave()} disabled={saving || uploading}>
                {saving ? "Saving…" : editingId ? "Update" : "Publish / Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
