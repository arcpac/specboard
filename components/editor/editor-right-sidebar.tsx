"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEditorStore } from "./editor-store";

export function EditorRightSidebar() {
  const isOpen = useEditorStore((state) => state.isRightSidebarOpen);
  const linkedTasks = useEditorStore((state) => state.linkedTasks);
  const selectionText = useEditorStore((state) => state.selectionText);
  const closeSidebar = useEditorStore((state) => state.closeRightSidebar);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <button
        type="button"
        aria-label="Close editor sidebar"
        className={cn(
          "absolute inset-0 bg-black/30 transition-opacity",
          isOpen ? "pointer-events-auto opacity-100" : "opacity-0",
        )}
        onClick={closeSidebar}
      />
      <section
        id="editor-right-sidebar"
        aria-label="Editor sidebar"
        aria-hidden={!isOpen}
        className={cn(
          "absolute right-0 top-0 z-10 flex h-dvh w-[min(24rem,calc(100vw-1rem))] translate-x-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "pointer-events-auto translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">
              Editor context
            </p>
            <h2 className="text-lg font-semibold">Document details</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close editor sidebar"
            onClick={closeSidebar}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Linked tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkedTasks.length ? (
                  linkedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border bg-muted/40 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant="accent">
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {task.sourceExcerpt}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tasks have been created from this document yet.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Selection snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {selectionText
                    ? selectionText
                    : "Highlight text in the editor to turn it into a board task."}
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}
