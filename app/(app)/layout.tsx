import { AppHeader } from "@/components/app-shell/app-header";
import { requireUser } from "@/lib/auth/guards";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
