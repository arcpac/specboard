import { notFound } from "next/navigation";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { PageHeader } from "@/components/app-shell/page-header";
import { getDocumentByIdForUser, getDocumentTasks } from "@/features/documents/queries";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace } from "@/lib/permissions/workspaces";

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Document"
        title={documentRecord.document.title}
        description="Draft the spec, capture context, and turn highlighted decisions into trackable tasks."
      />
      <RichTextEditor
        workspaceSlug={workspaceSlug}
        documentId={documentRecord.document.id}
        initialTitle={documentRecord.document.title}
        initialContent={documentRecord.document.contentJson as Record<string, unknown>}
        canEdit={canEditWorkspace(membership.role)}
        linkedTasks={linkedTasks.map(({ task }) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          sourceExcerpt: task.sourceExcerpt,
        }))}
      />
    </div>
  );
}
