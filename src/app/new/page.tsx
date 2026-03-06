"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export default function NewMeetingPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function create() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Meeting" }),
      });

      const room = await res.json();

      if (!res.ok) {
        console.error("Failed to create room:", room.error);
        router.push("/");
        return;
      }

      await supabase.from("meetings").insert({
        title: room.title,
        room_name: room.name,
        room_url: room.url,
        host_id: user.id,
      });

      router.replace(`/call/${room.name}`);
    }
    create();
  }, []);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
