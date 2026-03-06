"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import type { Channel } from "~/lib/types";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const workspaceId = params.id as string;

  useEffect(() => {
    async function redirectToDefault() {
      const { data: channels } = await supabase
        .from("channels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (channels && channels.length > 0) {
        router.replace(`/workspace/${workspaceId}/channel/${channels[0].id}`);
      }
    }
    redirectToDefault();
  }, [workspaceId, supabase, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    </div>
  );
}
