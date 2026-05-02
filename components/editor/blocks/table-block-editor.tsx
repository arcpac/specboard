import { Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoSizeTableCell } from "./auto-size-table-cell";
import type { TableBlockEditorProps } from "./types";

export function TableBlockEditor({
  block,
  canEdit,
  onChange,
  onFocus,
}: TableBlockEditorProps) {
  function handleCellChange(rowIndex: number, cellIndex: number, value: string) {
    onChange({
      rows: block.content.rows.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cell, currentCellIndex) =>
              currentCellIndex === cellIndex ? value : cell,
            )
          : row,
      ),
    });
  }

  function handleAddRow() {
    const columnCount = block.content.rows[0]?.length ?? 3;

    onChange({
      rows: [
        ...block.content.rows,
        Array.from({ length: columnCount }, () => ""),
      ],
    });
  }

  function handleAddColumn() {
    onChange({
      rows: block.content.rows.map((row, rowIndex) => [
        ...row,
        rowIndex === 0 ? `Column ${row.length + 1}` : "",
      ]),
    });
  }

  return (
    <section className="bg-muted/20 p-4" onFocusCapture={onFocus}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Table2 className="h-3.5 w-3.5" />
          Table block
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleAddRow}>
              Add row
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddColumn}
            >
              Add column
            </Button>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse overflow-hidden rounded-md border border-border/80 bg-card">
          <tbody>
            {block.content.rows.map((row, rowIndex) => (
              <tr key={`${block.id}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                    className={rowIndex === 0 ? "bg-muted/50" : ""}
                  >
                    <AutoSizeTableCell
                      value={cell}
                      onChange={(event) =>
                        handleCellChange(rowIndex, cellIndex, event.target.value)
                      }
                      disabled={!canEdit}
                      className="block w-full min-w-0 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
