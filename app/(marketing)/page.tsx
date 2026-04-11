import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckSquare2, Files, KanbanSquare, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function MarketingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(31,79,70,0.18),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.45),_rgba(244,242,236,1))]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                SpecBoard
              </p>
              <p className="text-sm text-muted-foreground">
                Shared specs with tasks built in.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge variant="accent">Collaborative product workspaces</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Write product specs like a doc. Ship follow-through like a board.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              SpecBoard gives teams one workspace for product notes, rich-text specs,
              and the tasks that emerge from them. Draft, align, and move selected
              decisions directly into a shared execution board.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Build your first workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Sign in to continue</Link>
              </Button>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Files,
                  title: "Rich specs",
                  description: "Tiptap docs with headings, checklists, tables, and links.",
                },
                {
                  icon: CheckSquare2,
                  title: "Task extraction",
                  description: "Highlight a decision and turn it into a tracked task.",
                },
                {
                  icon: Users2,
                  title: "Protected workspaces",
                  description: "Owner, editor, and viewer roles keep shared work clear.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-white/70 bg-white/70 backdrop-blur">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="overflow-hidden border-white/60 bg-white/75 shadow-xl backdrop-blur">
            <CardHeader className="border-b border-border/60 bg-muted/50">
              <CardTitle>Today in the workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Spec excerpt
                </p>
                <h3 className="mt-3 text-lg font-semibold">Billing v2 rollout plan</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  “Launch gating must include customer migration messaging, metrics on
                  failed invoices, and a rollback window.”
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  { status: "Todo", title: "Draft migration comms" },
                  { status: "In Progress", title: "Instrument failed invoice alerts" },
                  { status: "Done", title: "Define rollback checkpoints" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span className="font-medium">{item.title}</span>
                    <Badge variant={item.status === "Done" ? "accent" : "default"}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
