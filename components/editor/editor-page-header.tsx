"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

export function EditorPageHeader({
  title,
  onTitleChange,
  canEdit,
  lastSavedLabel,
  children,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  canEdit: boolean;
  lastSavedLabel: string;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-toolbar/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-6 py-1 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-10 max-w-3xl border-0 bg-transparent px-0 text-md font-semibold shadow-none focus-visible:outline-none"
            disabled={!canEdit}
            aria-label="Document title"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">Last saved {lastSavedLabel}</p>
        </div>
      </div>
      {children}
    </header>
  );
}
