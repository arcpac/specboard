import { Activity } from "lucide-react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getWorkspaceActivity } from "@/features/activity/queries";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { formatRelativeDate } from "@/lib/utils";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { user, workspace } = await requireWorkspaceAccess(workspaceSlug);
  const activity = await getWorkspaceActivity(workspaceSlug, user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Activity log"
        description="A running feed of workspace creation, document updates, and task changes."
      />
      {activity.length ? (
        <div className="space-y-3">
          {activity.map((entry) => (
            <Card key={entry.activity.id}>
              <CardContent className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {entry.actorName} {entry.activity.summary}
                  </p>
                  <p className="text-sm text-muted-foreground">{entry.actorEmail}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeDate(entry.activity.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No activity yet"
          description="Activity appears here once the workspace starts collecting documents or tasks."
          icon={<Activity className="h-6 w-6 text-primary" />}
        />
      )}
    </div>
  );
}
