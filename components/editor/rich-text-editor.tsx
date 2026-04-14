"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { createTaskFromSelectionAction } from "@/features/tasks/actions";
import { saveDocumentAction } from "@/features/documents/actions";
import { EditorPageHeader } from "./editor-page-header";
import { EditorPagesPanel, type EditorPageNavigationItem } from "./editor-pages-panel";
import { EditorToolbar } from "./editor-toolbar";
import { EditorRightSidebar } from "./editor-right-sidebar";
import type { EditorLinkedTask } from "./editor-store";
import { useEditorStore } from "./editor-store";

export function RichTextEditor({
  workspaceSlug,
  documentId,
  title,
  onTitleChange,
  lastSavedLabel,
  initialContent,
  canEdit,
  linkedTasks,
  pages,
  onSaved,
}: {
  workspaceSlug: string;
  documentId: string;
  title: string;
  onTitleChange: (title: string) => void;
  lastSavedLabel: string;
  initialContent: Record<string, unknown>;
  canEdit: boolean;
  linkedTasks: EditorLinkedTask[];
  pages: EditorPageNavigationItem[];
  onSaved: (updatedAt: string) => void;
}) {
  const router = useRouter();
  const [selectionText, setSelectionText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isTaskPending, startTaskTransition] = useTransition();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const setEditorSelectionText = useEditorStore((state) => state.setSelectionText);
  const setEditorLinkedTasks = useEditorStore((state) => state.setLinkedTasks);
  const toggleRightSidebar = useEditorStore((state) => state.toggleRightSidebar);

  function updateSelectionSnapshot(nextEditor: Editor) {
    const { from, to } = nextEditor.state.selection;
    const text = nextEditor.state.doc.textBetween(from, to, " ").trim();
    setSelectionText(text);
    setEditorSelectionText(text);
  }

  useEffect(() => {
    setEditorLinkedTasks(linkedTasks);
  }, [linkedTasks, setEditorLinkedTasks]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "tiptap document-page-editor bg-document px-6 py-8 text-[15px] leading-7 text-foreground sm:px-12 sm:py-12 md:px-[22mm] md:py-[24mm]",
      },
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: false,
      }),
    ],
    onSelectionUpdate: ({ editor: nextEditor }) => {
      updateSelectionSnapshot(nextEditor);
    },
    onCreate: ({ editor: nextEditor }) => {
      updateSelectionSnapshot(nextEditor);
    },
  });

  async function handleSave() {
    if (!editor) {
      return;
    }

    setFeedback(null);
    startSaveTransition(async () => {
      const result = await saveDocumentAction({
        workspaceSlug,
        documentId,
        title,
        contentJson: editor.getJSON(),
      });

      if (!result.ok) {
        setFeedback(result.message ?? "Unable to save document.");
        return;
      }

      if (result.updatedAt) {
        onSaved(result.updatedAt);
      }

      setFeedback("Document saved.");
      router.refresh();
    });
  }

  async function handleCreateTask() {
    if (!selectionText.trim()) {
      setFeedback("Select some text in the editor before creating a task.");
      return;
    }

    setFeedback(null);
    startTaskTransition(async () => {
      const result = await createTaskFromSelectionAction({
        workspaceSlug,
        documentId,
        title: taskTitle.trim() || selectionText.trim().slice(0, 80),
        description: taskDescription,
        sourceExcerpt: selectionText.trim(),
        sourceHeading: title,
      });

      if (!result.ok) {
        setFeedback(result.message ?? "Unable to create task.");
        return;
      }

      setTaskDialogOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setFeedback("Task created from selection.");
      router.refresh();
    });
  }

  function handleLinkToggle() {
    if (!editor || !canEdit) {
      return;
    }

    const existingHref = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "Enter a URL for the selected text. Leave empty to remove the link.",
      existingHref ?? "https://",
    );

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div className="-mx-6 grid min-h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-x-clip bg-workspace">
      <EditorPageHeader
        title={title}
        onTitleChange={onTitleChange}
        canEdit={canEdit}
        lastSavedLabel={lastSavedLabel}
      >
        <EditorToolbar
          editor={editor}
          canEdit={canEdit}
          feedback={feedback}
          isSaving={isSaving}
          isTaskPending={isTaskPending}
          selectionText={selectionText}
          taskTitle={taskTitle}
          taskDescription={taskDescription}
          taskDialogOpen={taskDialogOpen}
          onSave={handleSave}
          onToggleRightSidebar={toggleRightSidebar}
          onLinkToggle={handleLinkToggle}
          onTaskDialogOpenChange={setTaskDialogOpen}
          onTaskTitleChange={setTaskTitle}
          onTaskDescriptionChange={setTaskDescription}
          onCreateTask={handleCreateTask}
        />
      </EditorPageHeader>
      <div className="relative flex min-h-0 min-w-0">
        <EditorPagesPanel
          workspaceSlug={workspaceSlug}
          currentDocumentId={documentId}
          pages={pages}
        />
        <main className="min-w-0 flex-1 overflow-x-auto px-4 py-8 sm:px-8 lg:px-12">
          <div className="document-page mx-auto aspect-[210/297] w-full max-w-[210mm] bg-document text-card-foreground shadow-[0_18px_45px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.08)] ring-1 ring-[rgba(15,23,42,0.08)]">
            <EditorContent editor={editor} />
          </div>
        </main>
        <EditorRightSidebar />
      </div>
    </div>
  );
}
