"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const CATEGORIES = [
  "CAREER",
  "AI",
  "PRODUCT",
  "JOBS",
  "INTERVIEWS",
  "STARTUPS",
  "BUSINESS",
  "TECHNOLOGY",
  "COLLEGE",
  "GENERAL",
] as const;

type PostItem = {
  id: string;
  title?: string | null;
  content: string;
  category: string;
  isDemo?: boolean;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
  _count: { comments: number; reactions: number };
};

export default function CommunityPage() {
  const [items, setItems] = useState<PostItem[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState<(typeof CATEGORIES)[number]>("GENERAL");
  const [busy, setBusy] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = category ? `?category=${encodeURIComponent(category)}` : "";
      const res = await fetch(`/api/community${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load community");
        return;
      }
      setItems(data.items || []);
    } catch {
      setError("Unable to load community");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || undefined, content, category: postCategory }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to create post");
        return;
      }
      setTitle("");
      setContent("");
      await load();
    } catch {
      setError("Unable to create post");
    } finally {
      setBusy(false);
    }
  }

  async function react(postId: string) {
    const res = await fetch("/api/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, action: "react" }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, _count: { ...p._count, reactions: p._count.reactions + 1 } } : p,
        ),
      );
    }
  }

  async function comment(postId: string) {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    const res = await fetch("/api/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, action: "comment", content: text }),
    });
    if (res.ok) {
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setItems((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p,
        ),
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Community"
        description="Share career questions, interview notes, and product discussions. Demo posts are marked."
        actions={
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create a post</CardTitle>
          <CardDescription>Keep it constructive — no invented company endorsements.</CardDescription>
        </CardHeader>
        <form onSubmit={createPost} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title (optional)</Label>
            <Input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-content">Content</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-category">Category</Label>
            <Select
              id="post-category"
              value={postCategory}
              onChange={(e) => setPostCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Posting…" : "Publish"}
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : !items.length ? (
        <EmptyState title="No posts yet" description="Be the first to start a conversation in this category." />
      ) : (
        <div className="space-y-3">
          {items.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{post.category}</Badge>
                  {post.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                </div>
                <CardTitle>{post.title || "Untitled discussion"}</CardTitle>
                <CardDescription>
                  {post.author.name || "Member"} · {new Date(post.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{post.content}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{post._count.reactions} likes</span>
                <span>{post._count.comments} comments</span>
                <Button size="sm" variant="outline" onClick={() => void react(post.id)}>
                  Like
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={commentDrafts[post.id] || ""}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Write a comment…"
                />
                <Button size="sm" variant="secondary" onClick={() => void comment(post.id)}>
                  Comment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
