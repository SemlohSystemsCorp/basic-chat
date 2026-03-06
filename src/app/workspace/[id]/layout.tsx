"use client";

import { useParams } from "next/navigation";
import { WorkspaceSidebar } from "~/components/workspace-sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar workspaceId={id} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
