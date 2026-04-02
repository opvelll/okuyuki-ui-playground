import { create } from "zustand";

type UiState = {
  physicsEnabled: boolean;
  setPhysicsEnabled: (enabled: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  physicsEnabled: true,
  setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),
}));
