import { create } from "zustand";

type WorkspaceSidebarState = {
  isExpanded: boolean;
  toggleExpanded: () => void;
};

export const useWorkspaceSidebarStore = create<WorkspaceSidebarState>((set) => ({
  isExpanded: false,
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));
