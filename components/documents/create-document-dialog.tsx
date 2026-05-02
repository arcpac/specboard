"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { FilePlus2, Loader2 } from "lucide-react";
import { createDocumentAction } from "@/features/documents/actions";
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating..." : "Create document"}
    </Button>
  );
}

export function CreateDocumentDialog({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <FilePlus2 className="h-4 w-4" />
          Create document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create document</DialogTitle>
          <DialogDescription>
            Enter a title to start a new document.
          </DialogDescription>
        </DialogHeader>
        <form action={createDocumentAction} className="mt-5 space-y-4">
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <div className="space-y-2">
            <Label htmlFor="document-title">Document title</Label>
            <Input
              id="document-title"
              name="title"
              placeholder="New product spec"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
