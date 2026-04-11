import { WorkspaceSidebar } from "@/components/app-shell/workspace-sidebar";
import { requireWorkspaceAccess } from "@/lib/auth/guards";

export default async function WorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}>) {
  const { workspaceSlug } = await params;
  const { workspace, membership } = await requireWorkspaceAccess(workspaceSlug);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <WorkspaceSidebar
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        role={membership.role}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
