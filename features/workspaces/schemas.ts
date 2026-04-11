import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(3, "Workspace name must be at least 3 characters."),
  description: z
    .string()
    .trim()
    .max(240, "Description must be 240 characters or less.")
    .optional()
    .transform((value) => value || null),
});
