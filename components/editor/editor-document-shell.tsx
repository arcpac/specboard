"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { formatRelativeDate } from "@/lib/utils";
import type { EditorLinkedTask } from "./editor-store";

export function EditorDocumentShell({
  workspaceSlug,
  documentId,
  initialTitle,
  initialContent,
  canEdit,
  linkedTasks,
  initialLastSavedLabel,
}: {
  workspaceSlug: string;
  documentId: string;
  initialTitle: string;
  initialContent: Record<string, unknown>;
  canEdit: boolean;
  linkedTasks: EditorLinkedTask[];
  initialLastSavedLabel: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [lastSavedLabel, setLastSavedLabel] = useState(initialLastSavedLabel);

  function handleSaved(updatedAt: string) {
    setLastSavedLabel(formatRelativeDate(new Date(updatedAt)));
  }

  return (
    <RichTextEditor
      workspaceSlug={workspaceSlug}
      documentId={documentId}
      title={title}
      onTitleChange={setTitle}
      lastSavedLabel={lastSavedLabel}
      initialContent={initialContent}
      canEdit={canEdit}
      linkedTasks={linkedTasks}
      onSaved={handleSaved}
    />
  );
}
