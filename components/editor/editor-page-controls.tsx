"use client";

import { Plus } from "lucide-react";

export function EditorPageControls({
  currentPageNumber,
  totalPageCount,
  canEdit,
  onAddPage,
}: {
  currentPageNumber: number;
  totalPageCount: number;
  canEdit: boolean;
  onAddPage: () => void;
}) {
  return (
    <div
      aria-label="Page controls"
      className="flex w-full text-sm items-center justify-center gap-3 py-1"
    >
      <span className="min-w-24">
        Page {currentPageNumber} of {totalPageCount}
      </span>
      {canEdit ? (
        <div
          onClick={onAddPage}
          className="text-sm"
        >
          <Plus className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}
