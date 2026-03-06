"use client";

import { createContext, useContext } from "react";

const WorkspaceIdContext = createContext<string>("");

export function WorkspaceIdProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceIdContext.Provider value={workspaceId}>
      {children}
    </WorkspaceIdContext.Provider>
  );
}

export function useWorkspaceId() {
  return useContext(WorkspaceIdContext);
}
