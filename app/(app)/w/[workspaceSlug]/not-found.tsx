import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspaceNotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace not found</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This workspace may not exist yet, or your account does not have access to it.
        </p>
        <Button asChild>
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
