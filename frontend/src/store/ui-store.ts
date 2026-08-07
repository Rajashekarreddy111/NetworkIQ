import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "dark",
      sidebarCollapsed: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "networkiq-ui" },
  ),
);
