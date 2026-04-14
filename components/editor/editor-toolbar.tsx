"use client";

import { useMemo, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
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
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const compactButtonClassName = "h-8 gap-1.5 rounded-xs px-2.5 py-1 text-xs";
const compactIconClassName = "h-3.5 w-3.5";

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-xs border px-2 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted active:bg-accent"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({
  editor,
  canEdit,
  feedback,
  isSaving,
  isTaskPending,
  selectionText,
  taskTitle,
  taskDescription,
  taskDialogOpen,
  onSave,
  onToggleRightSidebar,
  onLinkToggle,
  onTaskDialogOpenChange,
  onTaskTitleChange,
  onTaskDescriptionChange,
  onCreateTask,
}: {
  editor: Editor | null;
  canEdit: boolean;
  feedback: string | null;
  isSaving: boolean;
  isTaskPending: boolean;
  selectionText: string;
  taskTitle: string;
  taskDescription: string;
  taskDialogOpen: boolean;
  onSave: () => void;
  onToggleRightSidebar: () => void;
  onLinkToggle: () => void;
  onTaskDialogOpenChange: (open: boolean) => void;
  onTaskTitleChange: (title: string) => void;
  onTaskDescriptionChange: (description: string) => void;
  onCreateTask: () => void;
}) {
  const taskPreview = useMemo(() => selectionText.slice(0, 160), [selectionText]);

  return (
    <div className="flex w-full flex-wrap items-center gap-1 border-t border-border bg-toolbar px-6 py-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {feedback ? (
          <span className="mr-2 text-xs text-muted-foreground">{feedback}</span>
        ) : null}
        <Button
          onClick={onSave}
          disabled={!canEdit || isSaving}
          className={compactButtonClassName}
        >
          {isSaving ? (
            <Loader2 className={`${compactIconClassName} animate-spin`} />
          ) : (
            <Save className={compactIconClassName} />
          )}
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onToggleRightSidebar}
          className={compactButtonClassName}
        >
          Editor sidebar
        </Button>
      </div>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          disabled={!canEdit}
        >
          <Bold className={compactIconClassName} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive("heading", { level: 1 })}
          disabled={!canEdit}
        >
          <Heading1 className={compactIconClassName} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive("heading", { level: 2 })}
          disabled={!canEdit}
        >
          <Heading2 className={compactIconClassName} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
          disabled={!canEdit}
        >
          <List className={compactIconClassName} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          active={editor?.isActive("taskList")}
          disabled={!canEdit}
        >
          <CheckSquare className={compactIconClassName} />
        </ToolbarButton>
        <ToolbarButton
          onClick={onLinkToggle}
          active={editor?.isActive("link")}
          disabled={!canEdit}
        >
          <Link2 className={compactIconClassName} />
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
          <Table2 className={compactIconClassName} />
        </ToolbarButton>
        <Dialog open={taskDialogOpen} onOpenChange={onTaskDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              disabled={!canEdit || !selectionText.trim()}
              onClick={() => onTaskTitleChange(selectionText.slice(0, 80))}
              className={compactButtonClassName}
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
              <div className="rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                {taskPreview || "Select some text in the editor first."}
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-title">Task title</Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(event) => onTaskTitleChange(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(event) => onTaskDescriptionChange(event.target.value)}
                  placeholder="Optional implementation notes or context."
                />
              </div>
              <Button
                className="w-full"
                onClick={onCreateTask}
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
    </div>
  );
}
