import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden flex-col justify-between rounded-[2rem] border border-border bg-card p-8 lg:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Start a workspace
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Create a home for specs, notes, and the work they generate.
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Owners can create private workspaces, bring documents together, and
          keep the team aligned with a lightweight board.
        </p>
      </div>
      <Card className="border-white/70 bg-white/85 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Use email and password authentication for this MVP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-6 text-sm text-muted-foreground">
            Need the homepage first?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Visit the landing page
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
