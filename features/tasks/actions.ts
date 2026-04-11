"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { activityLogs, tasks } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace } from "@/lib/permissions/workspaces";
import { createTaskSchema, updateTaskStatusSchema } from "./schemas";

export async function createTaskFromSelectionAction(input: {
  workspaceSlug: string;
  documentId: string;
  title: string;
  description?: string;
  sourceExcerpt: string;
  sourceHeading?: string;
}) {
  const parsed = createTaskSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.flatten().formErrors[0] ??
        parsed.error.flatten().fieldErrors.title?.[0] ??
        "Unable to create task.",
    };
  }

  const { user, workspace, membership } = await requireWorkspaceAccess(
    parsed.data.workspaceSlug,
  );

  if (!canEditWorkspace(membership.role)) {
    return {
      ok: false,
      message: "You do not have permission to create tasks in this workspace.",
    };
  }

  const [task] = await db
    .insert(tasks)
    .values({
      workspaceId: workspace.id,
      documentId: parsed.data.documentId,
      title: parsed.data.title,
      description: parsed.data.description,
      sourceExcerpt: parsed.data.sourceExcerpt,
      sourceHeading: parsed.data.sourceHeading,
      createdById: user.id,
    })
    .returning();

  await db.insert(activityLogs).values({
    workspaceId: workspace.id,
    actorId: user.id,
    entityType: "task",
    entityId: task.id,
    actionType: "task.created",
    summary: `created task ${task.title}`,
    metadata: {
      documentId: task.documentId,
      status: task.status,
    },
  });

  revalidatePath(`/w/${parsed.data.workspaceSlug}/board`);
  revalidatePath(`/w/${parsed.data.workspaceSlug}/documents/${parsed.data.documentId}`);
  revalidatePath(`/w/${parsed.data.workspaceSlug}/activity`);

  return {
    ok: true,
  };
}

export async function updateTaskStatusAction(input: {
  workspaceSlug: string;
  taskId: string;
  status: "todo" | "in_progress" | "done";
}) {
  const parsed = updateTaskStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid task status update.",
    };
  }

  const { user, workspace, membership } = await requireWorkspaceAccess(
    parsed.data.workspaceSlug,
  );

  if (!canEditWorkspace(membership.role)) {
    return {
      ok: false,
      message: "You do not have permission to update tasks in this workspace.",
    };
  }

  const [task] = await db
    .update(tasks)
    .set({
      status: parsed.data.status,
      completedAt: parsed.data.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.workspaceId, workspace.id)))
    .returning();

  if (!task) {
    return {
      ok: false,
      message: "Task not found.",
    };
  }

  await db.insert(activityLogs).values({
    workspaceId: workspace.id,
    actorId: user.id,
    entityType: "task",
    entityId: task.id,
    actionType: "task.status_changed",
    summary: `moved task ${task.title} to ${task.status.replace("_", " ")}`,
    metadata: {
      status: task.status,
    },
  });

  revalidatePath(`/w/${parsed.data.workspaceSlug}/board`);
  revalidatePath(`/w/${parsed.data.workspaceSlug}/activity`);

  return {
    ok: true,
  };
}
