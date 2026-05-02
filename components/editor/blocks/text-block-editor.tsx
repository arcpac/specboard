import { useEffect } from "react";
import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { TiptapDocumentContent } from "@/features/documents/content";
import type { TextBlockEditorProps } from "./types";

export function TextBlockEditor({
  block,
  canEdit,
  shouldAutoFocus,
  onAutoFocusHandled,
  onChange,
  onFocus,
  onSelectionUpdate,
}: TextBlockEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    content: block.content.tiptap,
    editorProps: {
      attributes: {
        class:
          "tiptap document-block-editor min-h-7 text-[15px] leading-7 text-foreground",
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
      TaskList,
      TaskItem.configure({
        nested: false,
      }),
    ],
    onCreate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getJSON() as TiptapDocumentContent);
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getJSON() as TiptapDocumentContent);
    },
    onSelectionUpdate: ({ editor: nextEditor }) => {
      onSelectionUpdate(nextEditor);
    },
    onFocus: ({ editor: nextEditor }) => {
      onFocus(nextEditor);
    },
  });

  useEffect(() => {
    if (!shouldAutoFocus || !editor) {
      return;
    }

    editor.chain().focus("end").run();
    onAutoFocusHandled(block.id);
  }, [block.id, editor, onAutoFocusHandled, shouldAutoFocus]);

  return (
    <div
      data-text-block-id={block.id}
      className="border py-1 transition-colors focus-within:border-border/80 focus-within:bg-muted/10 hover:bg-muted/5"
    >
      <EditorContent editor={editor} />
    </div>
  );
}
