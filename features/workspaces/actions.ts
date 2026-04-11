"use server";

import { like } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { activityLogs, workspaceMembers, workspaces } from "@/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";
import { createWorkspaceSchema } from "./schemas";

export type CreateWorkspaceState = {
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string;
};

async function createUniqueWorkspaceSlug(name: string) {
  const baseSlug = slugify(name) || "workspace";
  const existing = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(like(workspaces.slug, `${baseSlug}%`));

  const existingSlugs = new Set(existing.map((row) => row.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  while (existingSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
}

export async function createWorkspaceAction(
  _state: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const user = await requireUser();
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const slug = await createUniqueWorkspaceSlug(parsed.data.name);

  const workspace = await db.transaction(async (tx) => {
    const [createdWorkspace] = await tx
      .insert(workspaces)
      .values({
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        createdById: user.id,
      })
      .returning();

    await tx.insert(workspaceMembers).values({
      workspaceId: createdWorkspace.id,
      userId: user.id,
      role: "owner",
    });

    await tx.insert(activityLogs).values({
      workspaceId: createdWorkspace.id,
      actorId: user.id,
      entityType: "workspace",
      entityId: createdWorkspace.id,
      actionType: "workspace.created",
      summary: `created workspace ${createdWorkspace.name}`,
      metadata: {
        workspaceSlug: createdWorkspace.slug,
      },
    });

    return createdWorkspace;
  });

  redirect(`/w/${workspace.slug}/documents`);
}
