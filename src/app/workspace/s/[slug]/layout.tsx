"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { WorkspaceSidebar } from "~/components/workspace-sidebar";
import { WorkspaceIdProvider } from "~/lib/workspace-context";

export default function WorkspaceSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const supabase = createClient();
  const slug = params.slug as string;
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function resolve() {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!workspace) {
        setNotFound(true);
        return;
      }
      setWorkspaceId(String(workspace.id));
    }
    resolve();
  }, [slug, supabase]);

  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Workspace not found</h1>
          <p className="text-sm text-muted-foreground">
            There&apos;s no workspace at <span className="font-mono">{slug}.georgeholmes.io</span>
          </p>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <WorkspaceIdProvider workspaceId={workspaceId}>
      <div className="flex h-screen overflow-hidden">
        <WorkspaceSidebar workspaceId={workspaceId} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </WorkspaceIdProvider>
  );
}
