"use client";

import Link from "next/link";
import { FileText, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "specboard:editor-pages-panel-open";
const STORAGE_CHANGE_EVENT = "specboard:editor-pages-panel-storage";

export type EditorPageNavigationItem = {
  id: string;
  title: string;
  updatedLabel: string;
};

export function EditorPagesPanel({
  workspaceSlug,
  currentDocumentId,
  pages,
}: {
  workspaceSlug: string;
  currentDocumentId: string;
  pages: EditorPageNavigationItem[];
}) {
  const isOpen = useSyncExternalStore(
    subscribeToPanelStorage,
    getPanelStorageSnapshot,
    getPanelServerSnapshot,
  );

  function toggleOpen() {
    window.localStorage.setItem(STORAGE_KEY, String(!isOpen));
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  }

  return (
    <aside
      id="editor-pages-panel"
      aria-label="Document pages"
      className={cn(
        "flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-card text-card-foreground shadow-sm transition-[width] duration-300 ease-out",
        isOpen ? "w-[min(17rem,50vw)]" : "w-16",
      )}
    >
      <div
        className={cn(
          "flex border-b border-border",
          isOpen ? "items-start gap-2" : "justify-center",
        )}
      >
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-controls="editor-pages-panel"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Hide pages panel" : "Show pages panel"}
          onClick={toggleOpen}
          className="m-3 h-9 w-9 shrink-0 shadow-md"
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
        <div className={cn("min-w-0 px-2 py-4", !isOpen && "sr-only")}>
          <p className="text-xs font-semibold uppercase text-primary">Pages</p>
          <h2 className="mt-1 truncate text-lg font-semibold">Documents</h2>
        </div>
      </div>
      <ScrollArea className={cn("min-h-0 flex-1", !isOpen && "hidden")}>
        <nav className="space-y-2 p-3" aria-label="Document pages">
          {pages.map((page) => {
            const isCurrent = page.id === currentDocumentId;

            return (
              <Link
                key={page.id}
                href={`/w/${workspaceSlug}/documents/${page.id}`}
                aria-current={isCurrent ? "page" : undefined}
                tabIndex={isOpen ? undefined : -1}
                className={cn(
                  "flex min-w-0 gap-3 rounded-md border px-3 py-3 text-left transition-colors",
                  isCurrent
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-transparent text-foreground hover:border-border hover:bg-muted",
                )}
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {page.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    Updated {page.updatedLabel}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function getPanelStorageSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

function getPanelServerSnapshot() {
  return true;
}

function subscribeToPanelStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_CHANGE_EVENT, callback);
  };
}
