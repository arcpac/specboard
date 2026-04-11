import Link from "next/link";
import { FolderPlus, Files } from "lucide-react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/guards";
import { formatRelativeDate } from "@/lib/utils";
import { getUserWorkspaces } from "@/features/workspaces/queries";

export default async function DashboardPage() {
  const user = await requireUser();
  const workspaces = await getUserWorkspaces(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user.name?.split(" ")[0] ?? "there"}`}
        description="Pick up a workspace, open a document, or spin up a new space for the next spec."
        actions={
          <Button asChild>
            <Link href="/workspaces/new">
              <FolderPlus className="h-4 w-4" />
              New workspace
            </Link>
          </Button>
        }
      />

      {workspaces.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map(({ workspace, membership }) => (
            <Card key={workspace.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{workspace.name}</CardTitle>
                  <Badge variant="accent">{membership.role}</Badge>
                </div>
                <CardDescription>
                  {workspace.description ?? "No workspace description yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm text-muted-foreground">
                  Updated {formatRelativeDate(workspace.updatedAt)}
                </p>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/w/${workspace.slug}/documents`}>Open workspace</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No workspaces yet"
          description="Create your first workspace to start drafting specs, notes, and tasks."
          icon={<Files className="h-6 w-6 text-primary" />}
          action={
            <Button asChild>
              <Link href="/workspaces/new">Create workspace</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
