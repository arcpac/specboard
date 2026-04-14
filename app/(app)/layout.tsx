import { AppLayoutShell } from "@/components/app-shell/app-layout-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <AppLayoutShell user={user}>{children}</AppLayoutShell>
  );
}
