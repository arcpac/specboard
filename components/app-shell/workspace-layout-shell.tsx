"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { WorkspaceRole } from "@/lib/permissions/workspaces";
import { WorkspaceSidebar } from "./workspace-sidebar";

export function WorkspaceLayoutShell({
  workspaceSlug,
  workspaceName,
  role,
  children,
}: {
  workspaceSlug: string;
  workspaceName: string;
  role: WorkspaceRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isEditorRoute = /^\/w\/[^/]+\/documents\/[^/]+/.test(pathname);
  const isDocumentsIndexRoute = pathname === `/w/${workspaceSlug}/documents`;

  if (isEditorRoute) {
    return <div className="min-w-0">{children}</div>;
  }

  return (
    <div className="grid gap-2 pr-2 lg:grid-cols-[7.5rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <WorkspaceSidebar
          workspaceSlug={workspaceSlug}
          workspaceName={workspaceName}
          role={role}
          fixed={isDocumentsIndexRoute}
        />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
