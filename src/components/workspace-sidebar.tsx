"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Hash,
  Plus,
  Settings,
  LogOut,
  Video,
  MessageSquare,
  ChevronDown,
  Users,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import type { Profile, Channel, Workspace, WorkspaceMember } from "~/lib/types";

export function WorkspaceSidebar({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<(WorkspaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingChannel, setAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Detect the base path: /workspace/123 or /workspace/s/slug
  const slugMatch = pathname.match(/^\/workspace\/s\/([^/]+)/);
  const basePath = slugMatch
    ? `/workspace/s/${slugMatch[1]}`
    : `/workspace/${workspaceId}`;

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  async function loadData() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();
    setUser(profile);

    const { data: ws } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();
    setWorkspace(ws);

    const { data: chs } = await supabase
      .from("channels")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    setChannels(chs ?? []);

    const { data: mems } = await supabase
      .from("workspace_members")
      .select("*, profile:profiles(*)")
      .eq("workspace_id", workspaceId);
    setMembers((mems as (WorkspaceMember & { profile: Profile })[]) ?? []);

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    const name = newChannelName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!name || !user) return;

    const { data: channel } = await supabase
      .from("channels")
      .insert({
        workspace_id: Number(workspaceId),
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (channel) {
      setChannels((prev) => [...prev, channel]);
      setAddingChannel(false);
      setNewChannelName("");
      router.push(`${basePath}/channel/${channel.id}`);
    }
  }

  function copySubdomainUrl() {
    if (!workspace) return;
    navigator.clipboard.writeText(`https://${workspace.slug}.georgeholmes.io`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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

  const otherMembers = members.filter((m) => m.user_id !== user?.id);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Workspace header */}
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-sm font-bold text-foreground truncate">
            {workspace?.name || "Workspace"}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
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
          </div>
        </div>
        {workspace?.slug && (
          <button
            onClick={copySubdomainUrl}
            className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe className="h-3 w-3" />
            <span className="truncate">{workspace.slug}.georgeholmes.io</span>
            {copiedUrl ? (
              <Check className="h-2.5 w-2.5 shrink-0" />
            ) : (
              <Copy className="h-2.5 w-2.5 shrink-0" />
            )}
          </button>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-2 pt-3 space-y-0.5">
        <Link
          href={basePath}
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
            pathname === basePath
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Threads
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <Video className="h-4 w-4" />
          Meetings
        </Link>
      </div>

      {/* Channels */}
      <div className="px-2 pt-4">
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </p>
          <button
            onClick={() => setAddingChannel(!addingChannel)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {addingChannel && (
          <form onSubmit={createChannel} className="px-1 mb-1">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="channel-name"
              autoFocus
              onBlur={() => {
                if (!newChannelName.trim()) setAddingChannel(false);
              }}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </form>
        )}

        <div className="space-y-0.5">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`${basePath}/channel/${channel.id}`}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors ${
                pathname === `${basePath}/channel/${channel.id}`
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{channel.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Direct Messages */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Direct messages
          </p>
          <div className="flex items-center text-[10px] text-muted-foreground">
            <Users className="h-3 w-3 mr-0.5" />
            {members.length}
          </div>
        </div>
        {otherMembers.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground text-center">
            No other members yet
          </p>
        ) : (
          otherMembers.map((member) => (
            <Link
              key={member.user_id}
              href={`${basePath}/dm/${member.user_id}`}
              className={`flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors ${
                pathname === `${basePath}/dm/${member.user_id}`
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary overflow-hidden">
                {member.profile?.avatar_url ? (
                  <img
                    src={member.profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  member.profile?.username?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <span className="truncate">
                {member.profile?.display_name || member.profile?.username}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <span className="text-xs font-medium text-foreground truncate">
              {user?.display_name || user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
