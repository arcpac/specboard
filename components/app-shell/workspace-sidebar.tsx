"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, KanbanSquare } from "lucide-react";
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
    <aside className="flex h-full w-full flex-col rounded-3xl border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:max-w-72">
      <div className="rounded-2xl border border-sidebar-border bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-muted">
          Workspace
        </p>
        <h2 className="mt-3 text-xl font-semibold">{workspaceName}</h2>
        <Badge variant="outline" className="mt-4 border-white/10 text-sidebar-foreground">
          {role}
        </Badge>
      </div>
      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const href = `/w/${workspaceSlug}/${item.href}`;
          const Icon = item.icon;
          const isActive = currentPath.startsWith(href);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/88 hover:bg-white/8",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard"
        className="rounded-2xl border border-sidebar-border px-4 py-3 text-sm text-sidebar-muted transition-colors hover:bg-white/6 hover:text-sidebar-foreground"
      >
        Back to dashboard
      </Link>
    </aside>
  );
}
