"use client";

import * as React from "react";
import type { Discharge } from "@/types";

interface WorkspaceContextValue {
  discharge: Discharge;
  editable: boolean;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  discharge,
  editable,
  children,
}: WorkspaceContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ discharge, editable }), [discharge, editable]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
