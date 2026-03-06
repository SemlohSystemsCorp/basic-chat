"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DailyIframe, { DailyCall, DailyParticipant } from "@daily-co/daily-js";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  Copy,
  Check,
  MessageSquare,
  Send,
  X,
  Circle,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";

type ParticipantData = {
  session_id: string;
  user_name: string;
  local: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  hasScreen: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  screenTrack: MediaStreamTrack | null;
};

type ChatMessage = {
  id: number;
  sender_name: string;
  text: string;
  created_at: string;
};

function VideoTile({
  participant,
}: {
  participant: ParticipantData;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      videoRef.current.srcObject = new MediaStream([participant.videoTrack]);
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [participant.videoTrack]);

  useEffect(() => {
    if (audioRef.current && participant.audioTrack && !participant.local) {
      audioRef.current.srcObject = new MediaStream([participant.audioTrack]);
    } else if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [participant.audioTrack, participant.local]);

  return (
    <div className="relative aspect-video rounded-lg bg-foreground/5 overflow-hidden">
      {participant.hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.local}
          className="h-full w-full object-cover"
          style={participant.local ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
            {participant.user_name[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      {!participant.local && participant.hasAudio && (
        <audio ref={audioRef} autoPlay playsInline />
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {!participant.hasAudio && <MicOff className="h-3 w-3 text-red-400" />}
        <span>
          {participant.user_name}
          {participant.local ? " (You)" : ""}
        </span>
      </div>
    </div>
  );
}

function ScreenTile({
  participant,
}: {
  participant: ParticipantData;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.screenTrack) {
      videoRef.current.srcObject = new MediaStream([participant.screenTrack]);
    }
  }, [participant.screenTrack]);

  if (!participant.hasScreen || !participant.screenTrack) return null;

  return (
    <div className="relative col-span-full aspect-video rounded-lg bg-foreground/5 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {participant.user_name}&apos;s screen
      </div>
    </div>
  );
}

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const roomName = params.roomName as string;

  const callRef = useRef<DailyCall | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState("");
  const [recording, setRecording] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const extractParticipants = useCallback(() => {
    if (!callRef.current) return;
    const ps = callRef.current.participants();
    const list: ParticipantData[] = Object.values(ps).map(
      (p: DailyParticipant) => ({
        session_id: p.session_id,
        user_name: p.user_name || "Guest",
        local: p.local,
        hasVideo: p.tracks.video?.state === "playable",
        hasAudio: p.tracks.audio?.state === "playable",
        hasScreen: p.tracks.screenVideo?.state === "playable",
        videoTrack: p.tracks.video?.persistentTrack ?? null,
        audioTrack: p.tracks.audio?.persistentTrack ?? null,
        screenTrack: p.tracks.screenVideo?.persistentTrack ?? null,
      })
    );
    setParticipants(list);
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when chat is opened
  useEffect(() => {
    if (chatOpen) setUnread(0);
  }, [chatOpen]);

  // Subscribe to Realtime chat messages and load existing ones
  useEffect(() => {
    if (!joined) return;

    // Load existing messages for this room
    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_name", roomName)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    // Subscribe to new inserts
    const channel = supabase
      .channel(`chat:${roomName}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_name=eq.${roomName}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates (we already added our own optimistically)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setChatOpen((open) => {
            if (!open) setUnread((n) => n + 1);
            return open;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joined, roomName, supabase]);

  async function sendMessage() {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");

    await supabase.from("chat_messages").insert({
      room_name: roomName,
      sender_name: userName || "Guest",
      text,
    });
  }

  async function joinCall() {
    setJoining(true);
    setError("");

    try {
      const { data: meeting } = await supabase
        .from("meetings")
        .select("room_url")
        .eq("room_name", roomName)
        .single();

      const roomUrl = meeting?.room_url;
      if (!roomUrl) {
        setError("Meeting not found. Check the room code and try again.");
        setJoining(false);
        return;
      }

      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      });
      callRef.current = call;

      call.on("joined-meeting", () => {
        setJoined(true);
        setJoining(false);
        extractParticipants();
      });

      call.on("participant-joined", extractParticipants);
      call.on("participant-updated", extractParticipants);
      call.on("participant-left", extractParticipants);
      call.on("track-started", extractParticipants);
      call.on("track-stopped", extractParticipants);

      call.on("error", (e) => {
        setError(e?.errorMsg || "Failed to join call");
        setJoining(false);
      });

      await call.join({
        url: roomUrl,
        userName: userName || "Guest",
      });
    } catch {
      setError("Failed to join the call. Check that the room exists.");
      setJoining(false);
    }
  }

  function toggleCamera() {
    if (!callRef.current) return;
    const newState = !camOn;
    callRef.current.setLocalVideo(newState);
    setCamOn(newState);
  }

  function toggleMic() {
    if (!callRef.current) return;
    const newState = !micOn;
    callRef.current.setLocalAudio(newState);
    setMicOn(newState);
  }

  async function toggleRecording() {
    if (!callRef.current) return;
    if (recording) {
      await callRef.current.stopRecording();
      setRecording(false);
    } else {
      await callRef.current.startRecording();
      setRecording(true);
    }
  }

  async function toggleScreenShare() {
    if (!callRef.current) return;
    if (screenSharing) {
      callRef.current.stopScreenShare();
      setScreenSharing(false);
    } else {
      await callRef.current.startScreenShare();
      setScreenSharing(true);
    }
  }

  async function leaveCall() {
    // Delete all chat messages for this room
    await supabase.from("chat_messages").delete().eq("room_name", roomName);

    if (callRef.current) {
      await callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    setJoined(false);
    setParticipants([]);
    setMessages([]);
    router.push("/");
  }

  function copyLink() {
    const link = `${window.location.origin}/call/${roomName}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
      }
    };
  }, []);

  // Pre-join screen
  if (!joined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-md space-y-6 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Join Meeting
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Room: {roomName}
            </p>
          </div>

          {error && (
            <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex h-10 w-full rounded border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors"
            />
            <Button
              onClick={joinCall}
              disabled={joining}
              className="w-full"
              size="lg"
            >
              {joining ? "Joining..." : "Join now"}
            </Button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy invite link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // In-call view
  const screenSharer = participants.find((p) => p.hasScreen);
  const videoParticipants = participants;
  const gridCols =
    videoParticipants.length <= 1
      ? "grid-cols-1 max-w-2xl"
      : videoParticipants.length <= 4
        ? "grid-cols-2 max-w-4xl"
        : "grid-cols-3 max-w-5xl";

  const currentName = userName || "Guest";

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`mx-auto grid gap-3 ${gridCols}`}>
            {screenSharer && <ScreenTile participant={screenSharer} />}
            {videoParticipants.map((p) => (
              <VideoTile key={p.session_id} participant={p} />
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="flex w-80 flex-col border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Chat</h2>
              <button
                onClick={() => setChatOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No messages yet
                </p>
              )}
              {messages.map((msg) => {
                const isLocal = msg.sender_name === currentName;
                return (
                  <div key={msg.id} className={isLocal ? "text-right" : ""}>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {isLocal ? "You" : msg.sender_name}
                      <span className="ml-1.5 opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`inline-block rounded-lg px-3 py-1.5 text-sm ${
                        isLocal
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/5 text-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors"
                />
                <Button type="submit" size="icon" disabled={!draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-2">
          <Button
            variant={micOn ? "outline" : "destructive"}
            size="icon"
            onClick={toggleMic}
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={camOn ? "outline" : "destructive"}
            size="icon"
            onClick={toggleCamera}
            title={camOn ? "Turn off camera" : "Turn on camera"}
          >
            {camOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={screenSharing ? "secondary" : "outline"}
            size="icon"
            onClick={toggleScreenShare}
            title={screenSharing ? "Stop sharing" : "Share screen"}
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button
            variant={recording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            title={recording ? "Stop recording" : "Record"}
          >
            <Circle
              className={`h-5 w-5 ${recording ? "fill-current" : ""}`}
            />
          </Button>

          <div className="mx-2 h-8 w-px bg-border" />

          <Button
            variant={chatOpen ? "secondary" : "outline"}
            size="icon"
            onClick={() => setChatOpen(!chatOpen)}
            title="Chat"
            className="relative"
          >
            <MessageSquare className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </Button>

          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded px-3 py-2 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
            title="Copy invite link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {participants.length}
          </div>

          <div className="mx-2 h-8 w-px bg-border" />

          <Button variant="destructive" size="icon" onClick={leaveCall} title="Leave call">
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
