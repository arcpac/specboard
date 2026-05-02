import { Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ImageBlockEditorProps } from "./types";

export function ImageBlockEditor({
  block,
  canEdit,
  onChange,
  onFocus,
}: ImageBlockEditorProps) {
  return (
    <section className="bg-muted/20 p-4" onFocusCapture={onFocus}>
      <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <ImageIcon className="h-3.5 w-3.5" />
        Image block asdf
      </div>
      {block.content.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.content.src}
          alt={block.content.alt || "Inserted image"}
          className="mb-4 max-h-80 w-full rounded-md border border-border/70 bg-card object-contain"
        />
      ) : (
        <div className="mb-4 flex h-40 items-center justify-center rounded-md border border-dashed border-border bg-card/70 text-sm text-muted-foreground">
          Add an image URL to render a preview.
        </div>
      )}
      <div className="grid gap-3">
        <Input
          value={block.content.src}
          onChange={(event) =>
            onChange({
              ...block.content,
              src: event.target.value,
            })
          }
          placeholder="Image URL"
          disabled={!canEdit}
        />
        <Input
          value={block.content.alt}
          onChange={(event) =>
            onChange({
              ...block.content,
              alt: event.target.value,
            })
          }
          placeholder="Alt text"
          disabled={!canEdit}
        />
        <Textarea
          value={block.content.caption}
          onChange={(event) =>
            onChange({
              ...block.content,
              caption: event.target.value,
            })
          }
          placeholder="Caption"
          disabled={!canEdit}
          rows={3}
        />
      </div>
    </section>
  );
}
