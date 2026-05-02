"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Ellipsis, ExternalLink, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DocumentRow = {
  id: string;
  title: string;
  href: string;
  createdAtLabel: string;
  updatedAtLabel: string;
};

type PendingAction =
  | {
      kind: "delete" | "send";
      title: string;
    }
  | null;

export function DocumentsTable({
  documents,
  canEdit,
}: {
  documents: DocumentRow[];
  canEdit: boolean;
}) {
  const [titleSortDirection, setTitleSortDirection] = useState<"asc" | "desc">("asc");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const sortedDocuments = [...documents].sort((left, right) => {
    const comparison = left.title.localeCompare(right.title, undefined, {
      sensitivity: "base",
      numeric: true,
    });

    return titleSortDirection === "asc" ? comparison : comparison * -1;
  });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <th
                scope="col"
                aria-sort={titleSortDirection === "asc" ? "ascending" : "descending"}
                className="border-b border-border px-4 py-3 font-medium"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 gap-1 rounded-sm px-3 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setTitleSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                  }
                >
                  Title
                  {titleSortDirection === "asc" ? (
                    <ArrowUpAZ className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                  )}
                </Button>
              </th>
              <th scope="col" className="border-b border-border px-4 py-3 font-medium">
                Updated
              </th>
              <th scope="col" className="border-b border-border px-4 py-3 font-medium">
                Created
              </th>
              <th
                scope="col"
                className="border-b border-border px-4 py-3 text-right font-medium"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.map((document) => (
              <tr key={document.id} className="hover:bg-muted/30">
                <td className="border-b border-border px-4 py-3.5 align-middle">
                  <Link
                    href={document.href}
                    className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
                  >
                    {document.title}
                  </Link>
                </td>
                <td className="border-b border-border px-4 py-3.5 align-middle text-muted-foreground">
                  {document.updatedAtLabel}
                </td>
                <td className="border-b border-border px-4 py-3.5 align-middle text-muted-foreground">
                  {document.createdAtLabel}
                </td>
                <td className="border-b border-border px-4 py-3.5 align-middle">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                          aria-label={`Open actions for ${document.title}`}
                        >
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={document.href}>
                            <ExternalLink className="h-4 w-4" />
                            Open document
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setPendingAction({
                              kind: "send",
                              title: document.title,
                            })
                          }
                        >
                          <Send className="h-4 w-4" />
                          Send document
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!canEdit}
                          className="text-destructive focus:text-destructive"
                          onSelect={() =>
                            setPendingAction({
                              kind: "delete",
                              title: document.title,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete document
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.kind === "delete" ? "Delete document" : "Send document"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.kind === "delete"
                ? `A delete flow has not been implemented yet for "${pendingAction.title}".`
                : `A send flow has not been implemented yet for "${pendingAction?.title}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setPendingAction(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
