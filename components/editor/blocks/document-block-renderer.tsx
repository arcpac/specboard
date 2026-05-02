import { ImageBlockEditor } from "./image-block-editor";
import { TableBlockEditor } from "./table-block-editor";
import { TextBlockEditor } from "./text-block-editor";
import type { DocumentBlockRendererProps } from "./types";

export function DocumentBlockRenderer({
  block,
  canEdit,
  shouldAutoFocus,
  onAutoFocusHandled,
  onTextBlockChange,
  onImageBlockChange,
  onTableBlockChange,
  onTextBlockFocus,
  onNonTextBlockFocus,
  onSelectionUpdate,
}: DocumentBlockRendererProps) {
  switch (block.type) {
    case "text":
      return (
        <TextBlockEditor
          block={block}
          canEdit={canEdit}
          shouldAutoFocus={shouldAutoFocus}
          onAutoFocusHandled={onAutoFocusHandled}
          onChange={(tiptap) => onTextBlockChange(block.id, tiptap)}
          onFocus={(editor) => onTextBlockFocus(block.id, editor)}
          onSelectionUpdate={(editor) => onSelectionUpdate(block.id, editor)}
        />
      );
    case "image":
      return (
        <ImageBlockEditor
          block={block}
          canEdit={canEdit}
          onChange={(content) => onImageBlockChange(block.id, content)}
          onFocus={() => onNonTextBlockFocus(block.id)}
        />
      );
    case "table":
      return (
        <TableBlockEditor
          block={block}
          canEdit={canEdit}
          onChange={(content) => onTableBlockChange(block.id, content)}
          onFocus={() => onNonTextBlockFocus(block.id)}
        />
      );
    default:
      return null;
  }
}
