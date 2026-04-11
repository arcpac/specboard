import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await hash(input.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      passwordHash,
    })
    .returning();

  return user;
}
