import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./config";

export const getCurrentSession = cache(async () => getServerSession(authOptions));

export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();
  return session?.user ?? null;
});
