"use client";

import { useParams } from "next/navigation";
import { WorkspaceSidebar } from "~/components/workspace-sidebar";
import { WorkspaceIdProvider } from "~/lib/workspace-context";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;

  return (
    <WorkspaceIdProvider workspaceId={id}>
      <div className="flex h-screen overflow-hidden">
        <WorkspaceSidebar workspaceId={id} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </WorkspaceIdProvider>
  );
}
