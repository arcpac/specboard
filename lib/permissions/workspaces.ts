export type WorkspaceRole = "owner" | "editor" | "viewer";
export type TaskStatus = "todo" | "in_progress" | "done";

export function canEditWorkspace(role: WorkspaceRole) {
  return role === "owner" || role === "editor";
}

export function isOwner(role: WorkspaceRole) {
  return role === "owner";
}
