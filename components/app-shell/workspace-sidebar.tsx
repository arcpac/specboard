"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, Home, KanbanSquare } from "lucide-react";
import type { WorkspaceRole } from "@/lib/permissions/workspaces";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const items = [
  { href: "documents", label: "Documents", icon: FileText },
  { href: "board", label: "Board", icon: KanbanSquare },
  { href: "activity", label: "Activity", icon: Activity },
];

export function WorkspaceSidebar({
  workspaceSlug,
  workspaceName,
  role,
}: {
  workspaceSlug: string;
  workspaceName: string;
  role: WorkspaceRole;
}) {
  const currentPath = usePathname();

  return (
    <aside
      id="editor-left-sidebar"
      aria-label={`${workspaceName} workspace navigation`}
      className="sticky top-0 flex h-dvh w-full flex-col self-start border border-sidebar-border bg-sidebar p-2 text-sidebar-foreground shadow-sm"
    >
      <div className="px-2 pb-4 pt-2 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
          Workspace
        </p>
        <h2 className="mt-1 truncate text-xs font-semibold" title={workspaceName}>
          {workspaceName}
        </h2>
        <Badge
          variant="outline"
          className="mt-2 max-w-full truncate border-sidebar-border px-2 py-0.5 text-[0.65rem] leading-4 text-sidebar-foreground"
        >
          {role}
        </Badge>
      </div>
      <nav
        className="flex flex-1 flex-col gap-2 border-t border-sidebar-border pt-4"
        aria-label="Workspace sections"
      >
        {items.map((item) => {
          const href = `/w/${workspaceSlug}/${item.href}`;
          const Icon = item.icon;
          const isActive = currentPath.startsWith(href);

          return (
            <Link
              key={item.href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md px-2 py-3 text-center text-xs font-medium leading-tight transition-colors",
                isActive
                  ? "bg-sidebar-active text-primary"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard"
        aria-label="Back to dashboard"
        title="Back to dashboard"
        className="mt-4 flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border border-sidebar-border px-2 py-3 text-center text-xs font-medium leading-tight text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
      >
        <Home className="h-5 w-5 shrink-0" />
        <span>Dashboard</span>
      </Link>
    </aside>
  );
}
