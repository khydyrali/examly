"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, Newspaper } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, Badge } from "@/components/ui/Card";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  content: string | null;
  view_count: number;
  published_at: string | null;
  author_id: string;
};

function excerpt(html: string | null, length = 140) {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export default function StudentBlogListPage() {
  const { supabase } = useSupabase();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: postError } = await supabase
        .from("blog_post")
        .select("id, title, slug, cover_image, content, view_count, published_at, author_id")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (postError) {
        setError(postError.message);
        setLoading(false);
        return;
      }

      const rows = (data as PostRow[]) ?? [];
      setPosts(rows);

      if (rows.length > 0) {
        const { data: likeData } = await supabase
          .from("blog_like")
          .select("post_id")
          .in("post_id", rows.map((r) => r.id));
        const counts: Record<string, number> = {};
        (likeData ?? []).forEach((row) => {
          counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
        });
        setLikeCounts(counts);
      }

      setLoading(false);
    };
    void load();
  }, [supabase]);

  useEffect(() => {
    const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
    if (authorIds.length === 0) return;
    const loadTutorNames = async () => {
      const { data } = await supabase.from("tutor_profile").select("id, display_name").in("id", authorIds);
      const map: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        if (row.display_name) map[row.id] = row.display_name;
      });
      setAuthorNames(map);
    };
    void loadTutorNames();
  }, [posts, supabase]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge color="violet">
          <Newspaper className="h-3.5 w-3.5" /> Blog
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold text-ink">Tips &amp; stories from your tutors.</h1>
        <p className="text-sm font-semibold text-ink-soft">Study tips, exam strategy, and news posted by our tutors.</p>
      </div>

      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {loading ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading posts…</Card>
      ) : posts.length === 0 ? (
        <Card className="p-6 text-center text-sm font-semibold text-ink-soft">No posts published yet — check back soon!</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/dashboard/student/blog/${post.slug}`}>
              <Card className="flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                {post.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_image} alt={post.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Newspaper className="h-8 w-8" />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="font-heading text-lg font-bold text-ink">{post.title}</h2>
                  <p className="flex-1 text-sm text-ink-soft">{excerpt(post.content)}</p>
                  <div className="flex items-center justify-between pt-2 text-xs font-semibold text-ink-soft">
                    <span>{authorNames[post.author_id] ?? "Tutor"}</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-rose-500" /> {likeCounts[post.id] ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-sky-500" /> {post.view_count}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
