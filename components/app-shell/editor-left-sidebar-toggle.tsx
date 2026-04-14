"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspaceSidebarStore } from "./workspace-sidebar-store";

export function EditorLeftSidebarToggle({ className }: { className?: string }) {
  const isExpanded = useWorkspaceSidebarStore((state) => state.isExpanded);
  const toggleExpanded = useWorkspaceSidebarStore((state) => state.toggleExpanded);
  const Icon = isExpanded ? PanelLeftClose : PanelLeftOpen;

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={toggleExpanded}
      aria-controls="editor-left-sidebar"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Hide sidebar titles" : "Show sidebar titles"}
      className={cn("w-full", !isExpanded && "px-0", className)}
    >
      <Icon className="h-4 w-4" />
      <span className={cn(isExpanded ? "hidden sm:inline" : "sr-only")}>
        {isExpanded ? "Hide sidebar titles" : "Show sidebar titles"}
      </span>
      <span className={cn("sm:hidden", !isExpanded && "sr-only")}>Sidebar</span>
    </Button>
  );
}
