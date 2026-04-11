import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, tasks, workspaceMembers, workspaces } from "@/db/schema";

export async function getWorkspaceTasks(workspaceSlug: string, userId: string) {
  return db
    .select({
      task: tasks,
      documentTitle: documents.title,
    })
    .from(tasks)
    .innerJoin(documents, eq(documents.id, tasks.documentId))
    .innerJoin(workspaces, eq(workspaces.id, tasks.workspaceId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, workspaces.id),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(workspaces.slug, workspaceSlug))
    .orderBy(asc(tasks.status), desc(tasks.updatedAt));
}
