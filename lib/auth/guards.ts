import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import { getCurrentUser } from "./session";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export const getWorkspaceAccess = cache(
  async (workspaceSlug: string, userId: string) => {
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
  },
);

export async function requireWorkspaceAccess(workspaceSlug: string) {
  const user = await requireUser();
  const access = await getWorkspaceAccess(workspaceSlug, user.id);

  if (!access) {
    redirect("/dashboard");
  }

  return {
    user,
    workspace: access.workspace,
    membership: access.membership,
  };
}
