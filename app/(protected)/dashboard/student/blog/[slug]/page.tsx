"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Heart, Newspaper } from "lucide-react";
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

export default function StudentBlogPostPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const [post, setPost] = useState<PostRow | null>(null);
  const [authorName, setAuthorName] = useState<string>("Tutor");
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: postError } = await supabase
        .from("blog_post")
        .select("id, title, slug, cover_image, content, view_count, published_at, author_id")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!isMounted) return;
      if (postError || !data) {
        setError(postError?.message ?? "Post not found.");
        setLoading(false);
        return;
      }

      const row = data as PostRow;
      setPost(row);

      const [{ data: tutor }, { data: likes }] = await Promise.all([
        supabase.from("tutor_profile").select("display_name").eq("id", row.author_id).maybeSingle(),
        supabase.from("blog_like").select("user_id").eq("post_id", row.id),
      ]);

      if (!isMounted) return;
      if (tutor?.display_name) setAuthorName(tutor.display_name);
      setLikeCount(likes?.length ?? 0);
      setLiked(Boolean(session && likes?.some((l) => l.user_id === session.user.id)));
      setLoading(false);

      void supabase.rpc("increment_blog_view", { p_post_id: row.id });
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [slug, supabase, session]);

  const toggleLike = async () => {
    if (!post || !session) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from("blog_like").delete().eq("post_id", post.id).eq("user_id", session.user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from("blog_like").insert({ post_id: post.id, user_id: session.user.id });
    }
  };

  if (loading) {
    return <Card className="p-6 text-center text-sm font-semibold text-ink-soft">Loading post…</Card>;
  }

  if (error || !post) {
    return (
      <div className="space-y-3">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => router.push("/dashboard/student/blog")}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-subtle bg-surface px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:bg-subtle/40"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button
        type="button"
        onClick={() => router.push("/dashboard/student/blog")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </button>

      <Card className="overflow-hidden">
        {post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt={post.title} className="h-56 w-full object-cover sm:h-72" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <Newspaper className="h-10 w-10" />
          </div>
        )}
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge color="violet">{authorName}</Badge>
              <h1 className="mt-2 font-heading text-2xl font-extrabold text-ink sm:text-3xl">{post.title}</h1>
              {post.published_at ? (
                <p className="text-xs font-semibold text-ink-soft">{new Date(post.published_at).toLocaleDateString()}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void toggleLike()}
                disabled={!session}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 ${
                  liked ? "bg-rose-500 text-white" : "border-2 border-subtle bg-surface text-ink"
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} /> {likeCount}
              </button>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                <Eye className="h-4 w-4" /> {post.view_count}
              </span>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-ink" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
        </div>
      </Card>
    </div>
  );
}
