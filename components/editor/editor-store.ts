import { create } from "zustand";
import type { TaskStatus } from "@/lib/permissions/workspaces";

export type EditorLinkedTask = {
  id: string;
  title: string;
  status: TaskStatus;
  sourceExcerpt: string;
};

type EditorState = {
  isRightSidebarOpen: boolean;
  linkedTasks: EditorLinkedTask[];
  selectionText: string;
  closeRightSidebar: () => void;
  openRightSidebar: () => void;
  setLinkedTasks: (linkedTasks: EditorLinkedTask[]) => void;
  setSelectionText: (selectionText: string) => void;
  toggleRightSidebar: () => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  isRightSidebarOpen: false,
  linkedTasks: [],
  selectionText: "",
  closeRightSidebar: () => set({ isRightSidebarOpen: false }),
  openRightSidebar: () => set({ isRightSidebarOpen: true }),
  setLinkedTasks: (linkedTasks) => set({ linkedTasks }),
  setSelectionText: (selectionText) => set({ selectionText }),
  toggleRightSidebar: () =>
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
}));
