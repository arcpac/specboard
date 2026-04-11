import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspaceTasks } from "@/features/tasks/queries";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { canEditWorkspace, type TaskStatus } from "@/lib/permissions/workspaces";

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: "todo", label: "Todo" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { user, workspace, membership } = await requireWorkspaceAccess(workspaceSlug);
  const tasks = await getWorkspaceTasks(workspaceSlug, user.id);
  const canEdit = canEditWorkspace(membership.role);

  const grouped = columns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.task.status === column.status),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Task board"
        description="Tasks created from documents land here with a snapshot of the source text."
      />
      {tasks.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {grouped.map((column) => (
            <Card key={column.status} className="h-full">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{column.label}</CardTitle>
                <Badge variant="outline">{column.tasks.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {column.tasks.length ? (
                  column.tasks.map(({ task, documentTitle }) => (
                    <div key={task.id} className="rounded-2xl border border-border bg-muted/40 p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <Link
                            href={`/w/${workspaceSlug}/documents/${task.documentId}`}
                            className="mt-1 inline-flex text-sm text-primary hover:underline"
                          >
                            {documentTitle}
                          </Link>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {task.sourceExcerpt}
                        </p>
                        {canEdit ? (
                          <TaskStatusSelect
                            workspaceSlug={workspaceSlug}
                            taskId={task.id}
                            status={task.status}
                          />
                        ) : (
                          <Badge variant="accent">{task.status.replace("_", " ")}</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tasks in this column yet.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tasks yet"
          description="Open a document, highlight a decision or requirement, and create the first task from the editor."
          icon={<KanbanSquare className="h-6 w-6 text-primary" />}
        />
      )}
    </div>
  );
}
