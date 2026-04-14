"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateTaskStatusAction } from "@/features/tasks/actions";
import type { TaskStatus } from "@/lib/permissions/workspaces";

const labels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export function TaskStatusSelect({
  workspaceSlug,
  taskId,
  status,
  disabled,
}: {
  workspaceSlug: string;
  taskId: string;
  status: TaskStatus;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={disabled || isPending}
        onChange={(event) => {
          const nextStatus = event.target.value as TaskStatus;
          setValue(nextStatus);
          startTransition(async () => {
            const result = await updateTaskStatusAction({
              workspaceSlug,
              taskId,
              status: nextStatus,
            });

            if (!result.ok) {
              setValue(status);
            }
          });
        }}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <option value="todo">{labels.todo}</option>
        <option value="in_progress">{labels.in_progress}</option>
        <option value="done">{labels.done}</option>
      </select>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}
