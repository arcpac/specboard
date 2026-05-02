import { FileText } from "lucide-react";
import { CreateDocumentDialog } from "@/components/documents/create-document-dialog";
import { DocumentsTable } from "@/components/documents/documents-table";
import { getWorkspaceDocuments } from "@/features/documents/queries";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace } from "@/lib/permissions/workspaces";
import { formatRelativeDate } from "@/lib/utils";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorkspaceDocumentsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { user, workspace, membership } = await requireWorkspaceAccess(workspaceSlug);
  const documents = await getWorkspaceDocuments(workspaceSlug, user.id);
  const canEdit = canEditWorkspace(membership.role);
  const documentRows = documents.map(({ document }) => ({
    id: document.id,
    title: document.title,
    href: `/w/${workspaceSlug}/documents/${document.id}`,
    updatedAtLabel: formatRelativeDate(document.updatedAt),
    createdAtLabel: formatRelativeDate(document.createdAt),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Documents"
        description="Rich specs, notes, and decision records live here. Open one to write and convert selected text into tasks."
        actions={canEdit ? <CreateDocumentDialog workspaceSlug={workspaceSlug} /> : null}
      />

      {documents.length ? (
        <Card>
          <CardContent className="p-0">
            <DocumentsTable documents={documentRows} canEdit={canEdit} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No documents yet"
          description={
            canEdit
              ? "Create the first document for this workspace and start writing the spec."
              : "No documents have been added to this workspace yet."
          }
          icon={<FileText className="h-6 w-6 text-primary" />}
        />
      )}
    </div>
  );
}
