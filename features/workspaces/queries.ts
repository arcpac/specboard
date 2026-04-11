import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, tasks, workspaceMembers, workspaces } from "@/db/schema";

export async function getUserWorkspaces(userId: string) {
  return db
    .select({
      workspace: workspaces,
      membership: workspaceMembers,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(workspaces.updatedAt));
}

export async function getWorkspaceSummary(workspaceId: string) {
  const [documentsCount, tasksCount] = await Promise.all([
    db.$count(documents, eq(documents.workspaceId, workspaceId)),
    db.$count(tasks, eq(tasks.workspaceId, workspaceId)),
  ]);

  return { documentsCount, tasksCount };
}

export async function getWorkspaceForUser(workspaceSlug: string, userId: string) {
  return db
    .select({
      workspace: workspaces,
      membership: workspaceMembers,
    })
    .from(workspaces)
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, workspaces.id),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(workspaces.slug, workspaceSlug))
    .then((rows) => rows[0] ?? null);
}
