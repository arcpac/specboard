import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getEnv } from "@/lib/db/env";

const env = getEnv();

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  const isAuthenticated = Boolean(token);
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/workspaces") ||
    pathname.startsWith("/w/");

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const next = `${pathname}${search}`;

    if (next && next !== "/login") {
      loginUrl.searchParams.set("next", next);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspaces/:path*", "/w/:path*", "/login", "/register"],
};
