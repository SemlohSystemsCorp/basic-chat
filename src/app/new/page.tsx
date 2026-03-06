"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, Loader2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Navbar } from "~/components/navbar";

export default function NewMeetingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [enableRecording, setEnableRecording] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      }
    }
    checkAuth();
  }, [supabase, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "New Meeting",
          enableRecording,
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        }),
      });

      const room = await res.json();

      if (!res.ok) {
        setError(room.error || "Failed to create meeting");
        setCreating(false);
        return;
      }

      await supabase.from("meetings").insert({
        title: room.title,
        room_name: room.name,
        room_url: room.url,
        host_id: user.id,
        recording_enabled: enableRecording,
      });

      router.push(`/call/${room.name}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-lg px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              New meeting
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure and start your meeting
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="rounded border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting title</Label>
              <Input
                id="title"
                placeholder="e.g. Team standup, Design review..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">
                Max participants{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="100"
                placeholder="No limit"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable recording</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record the meeting to the cloud. Available on Pro and Team
                  plans.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableRecording(!enableRecording)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  enableRecording ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    enableRecording ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Start meeting"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
