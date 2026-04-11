import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { createDocumentAction } from "@/features/documents/actions";
import { getWorkspaceDocuments } from "@/features/documents/queries";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace } from "@/lib/permissions/workspaces";
import { formatRelativeDate } from "@/lib/utils";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function WorkspaceDocumentsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { user, workspace, membership } = await requireWorkspaceAccess(workspaceSlug);
  const documents = await getWorkspaceDocuments(workspaceSlug, user.id);
  const canEdit = canEditWorkspace(membership.role);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Documents"
        description="Rich specs, notes, and decision records live here. Open one to write and convert selected text into tasks."
      />

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a new document</CardTitle>
            <CardDescription>
              Start with a title, then open the editor to draft the full spec.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDocumentAction} className="flex flex-col gap-3 md:flex-row">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <Input name="title" placeholder="New product spec" required className="md:flex-1" />
              <Button type="submit">
                <FilePlus2 className="h-4 w-4" />
                Create document
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {documents.length ? (
        <div className="grid gap-4">
          {documents.map(({ document }) => (
            <Card key={document.id}>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{document.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Updated {formatRelativeDate(document.updatedAt)}
                  </p>
                </div>
                <Button asChild variant="secondary">
                  <Link href={`/w/${workspaceSlug}/documents/${document.id}`}>
                    Open document
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
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
