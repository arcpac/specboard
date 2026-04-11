import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, users, workspaceMembers, workspaces } from "@/db/schema";

export async function getWorkspaceActivity(workspaceSlug: string, userId: string) {
  return db
    .select({
      activity: activityLogs,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(activityLogs)
    .innerJoin(workspaces, eq(workspaces.id, activityLogs.workspaceId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, workspaces.id),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .innerJoin(users, eq(users.id, activityLogs.actorId))
    .where(eq(workspaces.slug, workspaceSlug))
    .orderBy(desc(activityLogs.createdAt));
}
