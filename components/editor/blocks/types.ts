import type { Editor } from "@tiptap/react";
import type {
  DocumentBlock,
  ImageDocumentBlock,
  TableDocumentBlock,
  TextDocumentBlock,
  TiptapDocumentContent,
} from "@/features/documents/content";

export type TextBlockChangeHandler = (
  blockId: string,
  tiptap: TiptapDocumentContent,
) => void;

export type ImageBlockChangeHandler = (
  blockId: string,
  content: ImageDocumentBlock["content"],
) => void;

export type TableBlockChangeHandler = (
  blockId: string,
  content: TableDocumentBlock["content"],
) => void;

export type TextBlockFocusHandler = (blockId: string, editor: Editor) => void;

export type NonTextBlockFocusHandler = (blockId: string) => void;

export type TextBlockSelectionUpdateHandler = (
  blockId: string,
  editor: Editor,
) => void;

export type DocumentBlockRendererProps = {
  block: DocumentBlock;
  canEdit: boolean;
  shouldAutoFocus: boolean;
  onAutoFocusHandled: (blockId: string) => void;
  onTextBlockChange: TextBlockChangeHandler;
  onImageBlockChange: ImageBlockChangeHandler;
  onTableBlockChange: TableBlockChangeHandler;
  onTextBlockFocus: TextBlockFocusHandler;
  onNonTextBlockFocus: NonTextBlockFocusHandler;
  onSelectionUpdate: TextBlockSelectionUpdateHandler;
};

export type TextBlockEditorProps = {
  block: TextDocumentBlock;
  canEdit: boolean;
  shouldAutoFocus: boolean;
  onAutoFocusHandled: (blockId: string) => void;
  onChange: (tiptap: TiptapDocumentContent) => void;
  onFocus: (editor: Editor) => void;
  onSelectionUpdate: (editor: Editor) => void;
};

export type ImageBlockEditorProps = {
  block: ImageDocumentBlock;
  canEdit: boolean;
  onChange: (content: ImageDocumentBlock["content"]) => void;
  onFocus: () => void;
};

export type TableBlockEditorProps = {
  block: TableDocumentBlock;
  canEdit: boolean;
  onChange: (content: TableDocumentBlock["content"]) => void;
  onFocus: () => void;
};
