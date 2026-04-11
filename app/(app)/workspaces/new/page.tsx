import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceCreateForm } from "@/components/workspaces/workspace-create-form";

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Workspace setup"
        title="Create a new workspace"
        description="Owners can start the workspace, create the first documents, and manage who can edit or view the content."
      />
      <Card>
        <CardHeader>
          <CardTitle>Workspace details</CardTitle>
          <CardDescription>
            Use a clear name. The URL slug will be generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
