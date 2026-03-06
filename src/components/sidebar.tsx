"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Settings,
  LogOut,
  Clock,
  Home,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import type { Meeting, Profile } from "~/lib/types";
import { timeAgo } from "~/lib/utils";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<Profile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();
    setUser(profile);

    const { data: recentMeetings } = await supabase
      .from("meetings")
      .select("*")
      .eq("host_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setMeetings(recentMeetings ?? []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/auth/login");
    router.refresh();
  }

  if (loading) {
    return (
      <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="p-3">
          <div className="h-8 animate-pulse rounded bg-muted" />
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <Video className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Module</span>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in to get started
            </p>
            <div className="flex flex-col gap-2">
              <Button size="sm" asChild>
                <Link href="/auth/login">Log In</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* User header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground overflow-hidden">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
            {user.display_name || user.username}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/settings">
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Nav */}
      <div className="px-2 pt-3 space-y-0.5">
        <Link
          href="/"
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
            pathname === "/"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/new"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          New meeting
        </Link>
      </div>

      {/* Recent meetings */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent
        </p>
        {meetings.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground text-center">
            No meetings yet
          </p>
        ) : (
          meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/call/${meeting.room_name}`}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                pathname === `/call/${meeting.room_name}`
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Video className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{meeting.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {timeAgo(meeting.created_at)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
