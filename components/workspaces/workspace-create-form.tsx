"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  createWorkspaceAction,
  type CreateWorkspaceState,
} from "@/features/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CreateWorkspaceState = {
  errors: {},
};

export function WorkspaceCreateForm() {
  const [state, action, pending] = useActionState(
    createWorkspaceAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Platform redesign, Q2 planning, API spec..."
          required
        />
        {state.errors?.name ? (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What kind of work lives in this workspace?"
        />
        {state.errors?.description ? (
          <p className="text-sm text-destructive">
            {state.errors.description[0]}
          </p>
        ) : null}
      </div>
      {state.message ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create workspace
      </Button>
    </form>
  );
}
