import Link from "next/link";
import { PanelLeftDashed } from "lucide-react";
import type { Session } from "next-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";

export function AppHeader({ user }: { user: Session["user"] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <PanelLeftDashed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                SpecBoard
              </p>
              <p className="text-sm text-muted-foreground">
                Specs, notes, and tasks in one workspace.
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-2 sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback name={user.name} />
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
