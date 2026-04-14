"use client";

import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { AppHeader } from "./app-header";

export function AppLayoutShell({
  user,
  children,
}: {
  user: Session["user"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEditorRoute = /^\/w\/[^/]+\/documents\/[^/]+/.test(pathname);

  return (
    <div className="min-h-screen">
      {isEditorRoute ? null : <AppHeader user={user} />}
      <div className={isEditorRoute ? "w-full px-6" : "mx-auto w-full max-w-full"}>
        {children}
      </div>
    </div>
  );
}
