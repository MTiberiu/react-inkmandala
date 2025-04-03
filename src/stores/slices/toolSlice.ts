// src/stores/slices/toolSlice.ts
import { StateCreator } from 'zustand';

// Tipuri pentru claritate
export type FloodType = 'DIRECT' | 'ANIMATED' | 'HOLD_AND_RELEASE';

export interface ToolSlice {
  selectedFloodType: FloodType;
  setFloodType: (type: FloodType) => void;
  // +++ Stare și Acțiune pentru Clear +++
  clearTrigger: number | null; 
  requestClear: () => void;
  // Aici pot veni: selectedColor, brushSize etc.
}

const createToolSlice: StateCreator<ToolSlice> = (set) => ({
  selectedFloodType: 'ANIMATED', // Implicit: comportamentul actual
  setFloodType: (type) => set({ selectedFloodType: type }),
  // Inițializează trigger-ul
  clearTrigger: null,
  // Acțiunea setează un nou timestamp, forțând actualizarea dependențelor
  requestClear: () => set({ clearTrigger: Date.now() }),
});

export default createToolSlice;