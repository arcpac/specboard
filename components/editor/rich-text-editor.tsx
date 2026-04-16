"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
import {
  createEmptyDocumentPage,
  createPaginatedDocumentContent,
  normalizeDocumentPages,
} from "./document-pages";
import { EditorPageHeader } from "./editor-page-header";
import { EditorPageControls } from "./editor-page-controls";
import { EditorPagesPanel } from "./editor-pages-panel";
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
  onSaved: (updatedAt: string) => void;
}) {
  const router = useRouter();
  const [documentPages, setDocumentPages] = useState(() =>
    normalizeDocumentPages(initialContent),
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const pageEditorsRef = useRef(new Map<string, Editor>());
  const pageElementsRef = useRef(new Map<string, HTMLDivElement>());
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

  function getDocumentPagesSnapshot() {
    return documentPages.map((page) => {
      const pageEditor = pageEditorsRef.current.get(page.id);

      return {
        ...page,
        contentJson: pageEditor?.getJSON() ?? page.contentJson,
      };
    });
  }

  function updateSelectionSnapshot(nextEditor: Editor) {
    const { from, to } = nextEditor.state.selection;
    const text = nextEditor.state.doc.textBetween(from, to, " ").trim();
    setSelectionText(text);
    setEditorSelectionText(text);
  }

  useEffect(() => {
    setEditorLinkedTasks(linkedTasks);
  }, [linkedTasks, setEditorLinkedTasks]);

  function handleAddPage(afterPageIndex: number) {
    if (!canEdit) {
      return;
    }

    const pageSnapshot = getDocumentPagesSnapshot();
    const insertIndex = Math.min(afterPageIndex + 1, pageSnapshot.length);
    const nextPage = createEmptyDocumentPage();

    setDocumentPages([
      ...pageSnapshot.slice(0, insertIndex),
      nextPage,
      ...pageSnapshot.slice(insertIndex),
    ]);
    setCurrentPageIndex(insertIndex);
    setFeedback("Page added.");
  }

  function handlePageSelect(pageId: string) {
    const pageIndex = documentPages.findIndex((page) => page.id === pageId);

    if (pageIndex < 0) {
      return;
    }

    const pageEditor = pageEditorsRef.current.get(pageId);
    const pageElement = pageElementsRef.current.get(pageId);

    setCurrentPageIndex(pageIndex);

    // if (pageEditor) {
    //   setActiveEditor(pageEditor);
    //   pageEditor.commands.focus();
    // }

    pageElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function handleSave() {
    if (!activeEditor) {
      return;
    }

    setFeedback(null);
    const pageSnapshot = getDocumentPagesSnapshot();
    startSaveTransition(async () => {
      const result = await saveDocumentAction({
        workspaceSlug,
        documentId,
        title,
        contentJson: createPaginatedDocumentContent(
          pageSnapshot,
          currentPageIndex,
          activeEditor.getJSON() as Record<string, unknown>,
        ),
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
    if (!activeEditor || !canEdit) {
      return;
    }

    const existingHref = activeEditor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "Enter a URL for the selected text. Leave empty to remove the link.",
      existingHref ?? "https://",
    );

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      activeEditor.chain().focus().unsetLink().run();
      return;
    }

    activeEditor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div className="-mx-6 grid h-dvh max-h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-workspace">
      <EditorPageHeader
        title={title}
        onTitleChange={onTitleChange}
        canEdit={canEdit}
        lastSavedLabel={lastSavedLabel}
      >
        <EditorToolbar
          editor={activeEditor}
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
      <div className="relative flex min-h-0 min-w-0 overflow-hidden">
        <EditorPagesPanel
          pages={documentPages.map((page, index) => ({
            id: page.id,
            label: `Page ${index + 1}`,
          }))}
          currentPageId={documentPages[currentPageIndex]?.id}
          onPageSelect={handlePageSelect}
        />
        <main className="h-full min-w-0 flex-1 overflow-auto px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto flex w-[210mm] min-w-[210mm] max-w-[210mm] shrink-0 flex-col items-center gap-4 pb-8">
            {documentPages.map((page, index) => (
              <div key={page.id} className="contents">
                <EditorPaper
                  pageId={page.id}
                  contentJson={page.contentJson}
                  canEdit={canEdit}
                  onSelectionUpdate={updateSelectionSnapshot}
                  onEditorReady={(pageId, pageEditor) => {
                    pageEditorsRef.current.set(pageId, pageEditor);

                    if (pageId === documentPages[currentPageIndex]?.id) {
                      setActiveEditor(pageEditor);
                    }
                  }}
                  onEditorDestroy={(pageId) => {
                    pageEditorsRef.current.delete(pageId);
                  }}
                  onPageElementReady={(pageId, pageElement) => {
                    pageElementsRef.current.set(pageId, pageElement);
                  }}
                  onPageElementDestroy={(pageId) => {
                    pageElementsRef.current.delete(pageId);
                  }}
                  onPageFocus={(pageId, pageEditor) => {
                    const pageIndex = documentPages.findIndex((page) => page.id === pageId);

                    if (pageIndex < 0) {
                      return;
                    }

                    setCurrentPageIndex(pageIndex);
                    setActiveEditor(pageEditor);
                  }}
                />
                <EditorPageControls
                  currentPageNumber={index + 1}
                  totalPageCount={Math.max(documentPages.length, 1)}
                  canEdit={canEdit}
                  onAddPage={() => handleAddPage(index)}
                />
              </div>
            ))}
          </div>
        </main>
        <EditorRightSidebar />
      </div>
    </div>
  );
}

function EditorPaper({
  pageId,
  contentJson,
  canEdit,
  onSelectionUpdate,
  onEditorReady,
  onEditorDestroy,
  onPageElementReady,
  onPageElementDestroy,
  onPageFocus,
}: {
  pageId: string;
  contentJson: Record<string, unknown>;
  canEdit: boolean;
  onSelectionUpdate: (editor: Editor) => void;
  onEditorReady: (pageId: string, editor: Editor) => void;
  onEditorDestroy: (pageId: string) => void;
  onPageElementReady: (pageId: string, element: HTMLDivElement) => void;
  onPageElementDestroy: (pageId: string) => void;
  onPageFocus: (pageId: string, editor: Editor) => void;
}) {
  const paperRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    content: contentJson,
    editorProps: {
      attributes: {
        class:
          "tiptap document-page-editor bg-document px-6 py-8 text-[15px] leading-7 text-foreground px-[22mm] py-[24mm]",
      },
      handleDOMEvents: {
        focus: () => {
          if (editor) {
            onPageFocus(pageId, editor);
          }

          return false;
        },
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
      onSelectionUpdate(nextEditor);
    },
    onCreate: ({ editor: nextEditor }) => {
      onSelectionUpdate(nextEditor);
      onEditorReady(pageId, nextEditor);
    },
    onFocus: ({ editor: nextEditor }) => {
      onPageFocus(pageId, nextEditor);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    onEditorReady(pageId, editor);

    return () => {
      onEditorDestroy(pageId);
    };
  }, [editor, onEditorDestroy, onEditorReady, pageId]);

  useEffect(() => {
    const paperElement = paperRef.current;

    if (!paperElement) {
      return;
    }

    onPageElementReady(pageId, paperElement);

    return () => {
      onPageElementDestroy(pageId);
    };
  }, [onPageElementDestroy, onPageElementReady, pageId]);

  return (
    <div
      ref={paperRef}
      className="document-page h-[297mm] min-h-[297mm] max-h-[297mm] w-full shrink-0 overflow-auto bg-document text-card-foreground shadow-[0_18px_45px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.08)] ring-1 ring-[rgba(15,23,42,0.08)]"
    >
      <EditorContent editor={editor} />
    </div>
  );
}
