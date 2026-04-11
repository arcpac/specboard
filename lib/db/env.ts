import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://postgres:postgres@127.0.0.1:5432/specboard"),
  AUTH_SECRET: z.string().min(1).default("specboard-dev-secret"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
});

export function getEnv() {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  });
}
