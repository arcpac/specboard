"use server";

import { redirect } from "next/navigation";
import { registerSchema } from "./schemas";
import { createUser, getUserByEmail } from "./server";

export type RegisterFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
};

export async function registerAction(
  _state: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUser = await getUserByEmail(parsed.data.email);

  if (existingUser) {
    return {
      message: "An account with that email already exists.",
    };
  }

  await createUser(parsed.data);
  redirect("/login?registered=1");
}
