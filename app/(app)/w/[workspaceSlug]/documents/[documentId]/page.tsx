import { notFound } from "next/navigation";
import { EditorDocumentShell } from "@/components/editor/editor-document-shell";
import {
  getDocumentByIdForUser,
  getDocumentTasks,
} from "@/features/documents/queries";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace } from "@/lib/permissions/workspaces";
import { formatRelativeDate } from "@/lib/utils";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; documentId: string }>;
}) {
  const { workspaceSlug, documentId } = await params;
  const { user, membership } = await requireWorkspaceAccess(workspaceSlug);
  const documentRecord = await getDocumentByIdForUser({
    workspaceSlug,
    documentId,
    userId: user.id,
  });

  if (!documentRecord) {
    notFound();
  }

  const linkedTasks = await getDocumentTasks(documentId);

  return (
    <EditorDocumentShell
      workspaceSlug={workspaceSlug}
      documentId={documentRecord.document.id}
      initialTitle={documentRecord.document.title}
      initialContent={documentRecord.document.contentJson as Record<string, unknown>}
      canEdit={canEditWorkspace(membership.role)}
      initialLastSavedLabel={formatRelativeDate(documentRecord.document.updatedAt)}
      linkedTasks={linkedTasks.map(({ task }) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        sourceExcerpt: task.sourceExcerpt,
      }))}
    />
  );
}
