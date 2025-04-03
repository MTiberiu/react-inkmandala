// src/stores/slices/toolSlice.ts
import { StateCreator } from 'zustand';

// Tipuri pentru claritate
export type FloodType = 'DIRECT' | 'ANIMATED' | 'HOLD_AND_RELEASE';

export interface ToolSlice {
  selectedFloodType: FloodType;
  setFloodType: (type: FloodType) => void;
  // Aici pot veni: selectedColor, brushSize etc.
}

const createToolSlice: StateCreator<ToolSlice> = (set) => ({
  selectedFloodType: 'ANIMATED', // Implicit: comportamentul actual
  setFloodType: (type) => set({ selectedFloodType: type }),
});

export default createToolSlice;