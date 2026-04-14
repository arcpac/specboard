import { WorkspaceLayoutShell } from "@/components/app-shell/workspace-layout-shell";
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
    <WorkspaceLayoutShell
      workspaceSlug={workspace.slug}
      workspaceName={workspace.name}
      role={membership.role}
    >
      {children}
    </WorkspaceLayoutShell>
  );
}
