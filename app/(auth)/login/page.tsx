import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { registered } = await searchParams;

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden flex-col justify-between rounded-[2rem] bg-primary p-8 text-primary-foreground lg:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            SpecBoard
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Shared product thinking that converts cleanly into execution.
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-primary-foreground/75">
          Move from rough notes to structured specs, then turn selected decisions
          into board tasks without leaving the document.
        </p>
      </div>
      <Card className="border-white/70 bg-white/85 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your workspaces, documents, and board tasks.
          </CardDescription>
          {registered ? (
            <div className="rounded-xl border border-accent bg-accent/50 px-4 py-3 text-sm text-accent-foreground">
              Your account is ready. Sign in to continue.
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-sm text-muted-foreground">
            Looking for the landing page?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
