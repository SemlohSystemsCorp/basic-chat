"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, Plus, Clock, Copy, Check, LinkIcon } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import type { Meeting } from "~/lib/types";
import { timeAgo } from "~/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setAuthed(true);

    const { data } = await supabase
      .from("meetings")
      .select("*, host:profiles(*)")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setMeetings(data ?? []);
    setLoading(false);
  }

  async function createMeeting() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setCreating(true);

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Meeting" }),
    });

    const room = await res.json();

    if (!res.ok) {
      console.error("Failed to create room:", room.error);
      setCreating(false);
      return;
    }

    await supabase.from("meetings").insert({
      title: room.title,
      room_name: room.name,
      room_url: room.url,
      host_id: user.id,
    });

    router.push(`/call/${room.name}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/call/${joinCode.trim()}`);
    }
  }

  function copyMeetingLink(meeting: Meeting) {
    const link = `${window.location.origin}/call/${meeting.room_name}`;
    navigator.clipboard.writeText(link);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mx-auto">
            <Video className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Module
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Video meetings for everyone. Simple, reliable, free.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Hero actions */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
          Meetings
        </h1>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={createMeeting}
            disabled={creating}
            className="gap-2"
          >
            <Video className="h-5 w-5" />
            {creating ? "Creating..." : "New meeting"}
          </Button>

          <form onSubmit={handleJoin} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter a room code to join"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex h-10 w-full rounded border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors"
              />
            </div>
            <Button type="submit" variant="outline" size="lg" disabled={!joinCode.trim()}>
              Join
            </Button>
          </form>
        </div>
      </div>

      {/* Meeting history */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Clock className="h-4 w-4" />
          Recent meetings
        </h2>
        {meetings.length === 0 ? (
          <div className="rounded border border-border bg-card py-12 text-center">
            <Video className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No meetings yet. Start your first meeting.
            </p>
            <Button onClick={createMeeting} disabled={creating}>
              <Plus className="h-4 w-4" />
              New meeting
            </Button>
          </div>
        ) : (
          <div className="rounded border border-border bg-card divide-y divide-border">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                  <Video className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {meeting.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(meeting.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyMeetingLink(meeting)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                    title="Copy meeting link"
                  >
                    {copiedId === meeting.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/call/${meeting.room_name}`}>Rejoin</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
