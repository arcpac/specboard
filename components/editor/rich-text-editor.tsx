"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import {
  Bold,
  CheckSquare,
  Heading1,
  Heading2,
  Link2,
  List,
  Loader2,
  Save,
  Table2,
} from "lucide-react";
import { createTaskFromSelectionAction } from "@/features/tasks/actions";
import { saveDocumentAction } from "@/features/documents/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TaskStatus } from "@/lib/permissions/workspaces";

type LinkedTask = {
  id: string;
  title: string;
  status: TaskStatus;
  sourceExcerpt: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  workspaceSlug,
  documentId,
  initialTitle,
  initialContent,
  canEdit,
  linkedTasks,
}: {
  workspaceSlug: string;
  documentId: string;
  initialTitle: string;
  initialContent: Record<string, unknown>;
  canEdit: boolean;
  linkedTasks: LinkedTask[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [selectionText, setSelectionText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isTaskPending, startTaskTransition] = useTransition();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "tiptap rounded-2xl bg-card px-6 py-6 text-[15px] leading-7 text-foreground",
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
      const { from, to } = nextEditor.state.selection;
      const text = nextEditor.state.doc.textBetween(from, to, " ").trim();
      setSelectionText(text);
    },
    onCreate: ({ editor: nextEditor }) => {
      const { from, to } = nextEditor.state.selection;
      const text = nextEditor.state.doc.textBetween(from, to, " ").trim();
      setSelectionText(text);
    },
  });

  const taskPreview = useMemo(() => selectionText.slice(0, 160), [selectionText]);

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Document editor
                </p>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-12 border-0 bg-transparent px-0 text-3xl font-semibold shadow-none focus-visible:outline-none"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {feedback ? (
                  <span className="text-sm text-muted-foreground">{feedback}</span>
                ) : null}
                <Button onClick={handleSave} disabled={!canEdit || isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive("bold")}
                disabled={!canEdit}
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor?.isActive("heading", { level: 1 })}
                disabled={!canEdit}
              >
                <Heading1 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor?.isActive("heading", { level: 2 })}
                disabled={!canEdit}
              >
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive("bulletList")}
                disabled={!canEdit}
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleTaskList().run()}
                active={editor?.isActive("taskList")}
                disabled={!canEdit}
              >
                <CheckSquare className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={handleLinkToggle}
                active={editor?.isActive("link")}
                disabled={!canEdit}
              >
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
                disabled={!canEdit}
              >
                <Table2 className="h-4 w-4" />
              </ToolbarButton>
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    disabled={!canEdit || !selectionText.trim()}
                    onClick={() => setTaskTitle(selectionText.slice(0, 80))}
                  >
                    Create task from selection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create task</DialogTitle>
                    <DialogDescription>
                      Tasks keep a snapshot of the selected text and link back to this
                      document.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                      {taskPreview || "Select some text in the editor first."}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Task title</Label>
                      <Input
                        id="task-title"
                        value={taskTitle}
                        onChange={(event) => setTaskTitle(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        value={taskDescription}
                        onChange={(event) => setTaskDescription(event.target.value)}
                        placeholder="Optional implementation notes or context."
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCreateTask}
                      disabled={isTaskPending}
                    >
                      {isTaskPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Create task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <EditorContent editor={editor} />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Linked tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {linkedTasks.length ? (
              linkedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{task.title}</p>
                    <Badge variant="accent">{task.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.sourceExcerpt}</p>
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
    </div>
  );
}
