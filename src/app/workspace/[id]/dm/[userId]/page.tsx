"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { useWorkspaceId } from "~/lib/workspace-context";
import type { DirectMessage, Profile } from "~/lib/types";

export default function DMPage() {
  const params = useParams();
  const supabase = createClient();
  const workspaceId = useWorkspaceId();
  const otherUserId = params.userId as string;

  const [messages, setMessages] = useState<(DirectMessage & { sender: Profile })[]>([]);
  const [draft, setDraft] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const [{ data: profile }, { data: other }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authUser.id).single(),
        supabase.from("profiles").select("*").eq("id", otherUserId).single(),
      ]);
      setUser(profile);
      setOtherUser(other);

      // Load DM history between these two users in this workspace
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*, sender:profiles!direct_messages_sender_id_fkey(*)")
        .eq("workspace_id", workspaceId)
        .or(`and(sender_id.eq.${authUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${authUser.id})`)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((msgs as (DirectMessage & { sender: Profile })[]) ?? []);
    }
    load();
  }, [otherUserId, workspaceId, supabase]);

  // Subscribe to new DMs
  useEffect(() => {
    if (!user) return;

    const sub = supabase
      .channel(`dm:${workspaceId}:${user.id}:${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          const msg = payload.new as DirectMessage;
          // Only show messages between these two users
          const isRelevant =
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id);
          if (!isRelevant) return;

          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", msg.sender_id)
            .single();
          const fullMsg = { ...msg, sender: sender as Profile };
          setMessages((prev) => {
            if (prev.some((m) => m.id === fullMsg.id)) return prev;
            return [...prev, fullMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user, otherUserId, workspaceId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !user || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");

    await supabase.from("direct_messages").insert({
      workspace_id: Number(workspaceId),
      sender_id: user.id,
      receiver_id: otherUserId,
      content,
    });
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* DM header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary overflow-hidden">
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            otherUser?.username?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <h1 className="text-sm font-bold text-foreground">
          {otherUser?.display_name || otherUser?.username || "Loading..."}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                {otherUser?.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {otherUser?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground">
                {otherUser?.display_name || otherUser?.username}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This is the start of your conversation. Say hi!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isLocal = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className="group flex gap-3 py-1 hover:bg-accent/30 rounded px-2 -mx-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary mt-0.5 overflow-hidden">
                {msg.sender?.avatar_url ? (
                  <img
                    src={msg.sender.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  msg.sender?.username?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {isLocal ? "You" : msg.sender?.display_name || msg.sender?.username}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-border px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${otherUser?.display_name || otherUser?.username || "..."}`}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
