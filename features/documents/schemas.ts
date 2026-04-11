import { z } from "zod";

export const createDocumentSchema = z.object({
  workspaceSlug: z.string().min(1),
  title: z.string().trim().min(3, "Document title must be at least 3 characters."),
});

export const saveDocumentSchema = z.object({
  workspaceSlug: z.string().min(1),
  documentId: z.string().min(1),
  title: z.string().trim().min(3, "Document title must be at least 3 characters."),
  contentJson: z.any(),
});
