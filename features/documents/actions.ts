"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { activityLogs, documents } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace } from "@/lib/permissions/workspaces";
import {
  createDocumentSchema,
  saveDocumentSchema,
} from "./schemas";
import { EMPTY_DOCUMENT_CONTENT } from "./queries";

export async function createDocumentAction(formData: FormData) {
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const parsed = createDocumentSchema.safeParse({
    workspaceSlug,
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect(`/w/${workspaceSlug}/documents?error=title`);
  }

  const { user, workspace, membership } = await requireWorkspaceAccess(workspaceSlug);

  if (!canEditWorkspace(membership.role)) {
    redirect(`/w/${workspaceSlug}/documents?error=forbidden`);
  }

  const [document] = await db
    .insert(documents)
    .values({
      workspaceId: workspace.id,
      title: parsed.data.title,
      contentJson: EMPTY_DOCUMENT_CONTENT,
      createdById: user.id,
      updatedById: user.id,
    })
    .returning();

  await db.insert(activityLogs).values({
    workspaceId: workspace.id,
    actorId: user.id,
    entityType: "document",
    entityId: document.id,
    actionType: "document.created",
    summary: `created document ${document.title}`,
    metadata: {
      documentId: document.id,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/documents`);
  redirect(`/w/${workspaceSlug}/documents/${document.id}`);
}

export async function saveDocumentAction(input: {
  workspaceSlug: string;
  documentId: string;
  title: string;
  contentJson: unknown;
}) {
  const parsed = saveDocumentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid document payload.",
    };
  }

  const { user, workspace, membership } = await requireWorkspaceAccess(
    parsed.data.workspaceSlug,
  );

  if (!canEditWorkspace(membership.role)) {
    return {
      ok: false,
      message: "You do not have permission to edit this workspace.",
    };
  }

  const [document] = await db
    .update(documents)
    .set({
      title: parsed.data.title,
      contentJson: parsed.data.contentJson,
      updatedById: user.id,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, parsed.data.documentId),
        eq(documents.workspaceId, workspace.id),
      ),
    )
    .returning();

  if (!document) {
    notFound();
  }

  await db.insert(activityLogs).values({
    workspaceId: workspace.id,
    actorId: user.id,
    entityType: "document",
    entityId: document.id,
    actionType: "document.updated",
    summary: `updated document ${document.title}`,
    metadata: {
      documentId: document.id,
    },
  });

  revalidatePath(`/w/${parsed.data.workspaceSlug}/documents`);
  revalidatePath(`/w/${parsed.data.workspaceSlug}/documents/${parsed.data.documentId}`);
  revalidatePath(`/w/${parsed.data.workspaceSlug}/activity`);

  return {
    ok: true,
    updatedAt: document.updatedAt.toISOString(),
  };
}
