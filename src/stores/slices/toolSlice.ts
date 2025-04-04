// src/stores/slices/toolSlice.ts
import { StateCreator } from 'zustand';

// Redenumit și adăugat 'DRAW'
export type PaintMode = 'DIRECT' | 'ANIMATED' | 'HOLD_AND_RELEASE' | 'DRAW';

export interface ToolSlice {
  selectedPaintMode: PaintMode; // Redenumit
  setPaintMode: (type: PaintMode) => void; // Redenumit
  clearTrigger: number | null;
  requestClear: () => void;
  // Aici poți adăuga în viitor: brushSize, selectedColor etc.
}

const createToolSlice: StateCreator<ToolSlice> = (set) => ({
  selectedPaintMode: 'ANIMATED', // Sau setează 'DRAW' ca implicit pt testare
  setPaintMode: (type) => set({ selectedPaintMode: type }), // Redenumit
  clearTrigger: null,
  requestClear: () => set({ clearTrigger: Date.now() }),
});

export default createToolSlice;