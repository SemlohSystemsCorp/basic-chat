"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export default function WorkspaceSlugPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const slug = params.slug as string;

  useEffect(() => {
    async function redirectToDefault() {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!workspace) return;

      const { data: channels } = await supabase
        .from("channels")
        .select("id")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (channels && channels.length > 0) {
        router.replace(`/workspace/s/${slug}/channel/${channels[0].id}`);
      }
    }
    redirectToDefault();
  }, [slug, supabase, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    </div>
  );
}
