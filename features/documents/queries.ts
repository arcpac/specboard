import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { documents, tasks, workspaceMembers, workspaces } from "@/db/schema";

export const EMPTY_DOCUMENT_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Start writing your product spec here.",
        },
      ],
    },
  ],
};

export async function getWorkspaceDocuments(workspaceSlug: string, userId: string) {
  return db
    .select({
      document: documents,
      workspace: workspaces,
      membership: workspaceMembers,
    })
    .from(documents)
    .innerJoin(workspaces, eq(workspaces.id, documents.workspaceId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, workspaces.id),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(and(eq(workspaces.slug, workspaceSlug), isNull(documents.archivedAt)))
    .orderBy(desc(documents.updatedAt));
}

export async function getDocumentByIdForUser(input: {
  workspaceSlug: string;
  documentId: string;
  userId: string;
}) {
  return db
    .select({
      document: documents,
      workspace: workspaces,
      membership: workspaceMembers,
    })
    .from(documents)
    .innerJoin(workspaces, eq(workspaces.id, documents.workspaceId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, workspaces.id),
        eq(workspaceMembers.userId, input.userId),
      ),
    )
    .where(
      and(
        eq(workspaces.slug, input.workspaceSlug),
        eq(documents.id, input.documentId),
        isNull(documents.archivedAt),
      ),
    )
    .then((rows) => rows[0] ?? null);
}

export async function getDocumentTasks(documentId: string) {
  return db
    .select({
      task: tasks,
    })
    .from(tasks)
    .where(eq(tasks.documentId, documentId))
    .orderBy(desc(tasks.createdAt));
}
