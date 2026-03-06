"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Clock,
  Copy,
  Check,
  LinkIcon,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Settings,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Navbar } from "~/components/navbar";
import type { Meeting } from "~/lib/types";
import { timeAgo } from "~/lib/utils";

function LandingPage() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Now with screen sharing and in-call chat
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Video meetings
          <br />
          <span className="text-primary">without the bloat</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Module is a simple, fast video calling platform. Create a meeting in one click, share the link, and start talking. No downloads required.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/auth/signup">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Log in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground mb-12">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Instant meetings
              </h3>
              <p className="text-sm text-muted-foreground">
                One click to create. Share a link and you&apos;re live. No scheduling hassle.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Secure by default
              </h3>
              <p className="text-sm text-muted-foreground">
                End-to-end encrypted calls powered by Daily.co infrastructure.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Built-in chat
              </h3>
              <p className="text-sm text-muted-foreground">
                Send messages during calls. Chat history is saved and cleaned up automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your free account and start a meeting in seconds.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signup">Create free account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built by George Holmes
          </p>
        </div>
      </footer>
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Actions */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
            Dashboard
          </h1>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={createMeeting}
              disabled={creating}
              className="flex items-center gap-4 rounded border border-border bg-card p-5 text-left transition-colors hover:border-primary/30 hover:bg-accent/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {creating ? "Creating..." : "New meeting"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Start a meeting instantly
                </p>
              </div>
            </button>

            <form
              onSubmit={handleJoin}
              className="flex items-center gap-3 rounded border border-border bg-card p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-primary/10">
                <LinkIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Join an existing meeting
                </p>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!joinCode.trim()}
              >
                Join
              </Button>
            </form>
          </div>

          <Link
            href="/settings"
            className="mt-4 flex items-center gap-3 rounded border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Settings</p>
              <p className="text-xs text-muted-foreground">
                Manage your profile, billing, and preferences
              </p>
            </div>
          </Link>
        </div>

        {/* Meeting history */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="h-4 w-4" />
            Recent meetings
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded border border-border bg-card"
                />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded border border-border bg-card py-12 text-center">
              <Video className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No meetings yet. Start your first one above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center gap-3 rounded border border-border bg-card px-4 py-3 transition-colors hover:border-border/80"
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
    </div>
  );
}

export default function HomePage() {
  const supabase = createClient();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, [supabase]);

  if (authed === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return authed ? <Dashboard /> : <LandingPage />;
}
