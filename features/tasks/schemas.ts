import { z } from "zod";

export const createTaskSchema = z.object({
  workspaceSlug: z.string().min(1),
  documentId: z.string().min(1),
  title: z.string().trim().min(3, "Task title must be at least 3 characters."),
  description: z
    .string()
    .trim()
    .max(400, "Description must be 400 characters or less.")
    .optional()
    .transform((value) => value || null),
  sourceExcerpt: z
    .string()
    .trim()
    .min(1, "Select some document text before creating a task."),
  sourceHeading: z
    .string()
    .trim()
    .max(120, "Heading must be 120 characters or less.")
    .optional()
    .transform((value) => value || null),
});

export const updateTaskStatusSchema = z.object({
  workspaceSlug: z.string().min(1),
  taskId: z.string().min(1),
  status: z.enum(["todo", "in_progress", "done"]),
});
