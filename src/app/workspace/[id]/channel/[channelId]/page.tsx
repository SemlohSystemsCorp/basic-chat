"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Hash, Send, Plus, Video } from "lucide-react";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import type { Channel, ChannelMessage, Profile } from "~/lib/types";

export default function ChannelPage() {
  const params = useParams();
  const supabase = createClient();
  const workspaceId = params.id as string;
  const channelId = params.channelId as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<(ChannelMessage & { sender: Profile })[]>([]);
  const [draft, setDraft] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setUser(profile);

      const { data: ch } = await supabase
        .from("channels")
        .select("*")
        .eq("id", channelId)
        .single();
      setChannel(ch);

      const { data: msgs } = await supabase
        .from("channel_messages")
        .select("*, sender:profiles(*)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((msgs as (ChannelMessage & { sender: Profile })[]) ?? []);
    }
    load();
  }, [channelId, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    const sub = supabase
      .channel(`channel:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const msg = payload.new as ChannelMessage;
          // Fetch sender profile
          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", msg.user_id)
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
  }, [channelId, supabase]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !user || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");

    await supabase.from("channel_messages").insert({
      channel_id: Number(channelId),
      user_id: user.id,
      content,
    });
    setSending(false);
  }

  // Group messages by date
  function formatDate(date: string) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  // Group messages by sender (consecutive)
  type MessageGroup = {
    sender: Profile;
    messages: (ChannelMessage & { sender: Profile })[];
    date: string;
  };

  const grouped: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const msg of messages) {
    const msgDate = formatDate(msg.created_at);
    if (
      currentGroup &&
      currentGroup.sender.id === msg.sender?.id &&
      currentGroup.date === msgDate
    ) {
      currentGroup.messages.push(msg);
    } else {
      currentGroup = {
        sender: msg.sender,
        messages: [msg],
        date: msgDate,
      };
      grouped.push(currentGroup);
    }
  }

  // Track which dates we've shown
  const shownDates = new Set<string>();

  return (
    <div className="flex h-full flex-col">
      {/* Channel header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-bold text-foreground">
            {channel?.name || "Loading..."}
          </h1>
          {channel?.description && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <span className="text-xs text-muted-foreground truncate max-w-xs">
                {channel.description}
              </span>
            </>
          )}
        </div>
        <Link href={`/`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Video className="h-4 w-4 mr-1.5" />
            Start call
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Hash className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">
                Welcome to #{channel?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This is the start of the channel. Send a message to get things
                going.
              </p>
            </div>
          </div>
        )}

        {grouped.map((group, gi) => {
          const showDateDivider = !shownDates.has(group.date);
          if (showDateDivider) shownDates.add(group.date);

          return (
            <div key={gi}>
              {showDateDivider && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.date}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>
              )}
              <div className="group flex gap-3 py-1 hover:bg-accent/30 rounded px-2 -mx-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary mt-0.5 overflow-hidden">
                  {group.sender?.avatar_url ? (
                    <img
                      src={group.sender.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    group.sender?.username?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {group.sender?.display_name || group.sender?.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(group.messages[0].created_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                  {group.messages.map((msg) => (
                    <p key={msg.id} className="text-sm text-foreground leading-relaxed">
                      {msg.content}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-border px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message #${channel?.name || "..."}`}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
