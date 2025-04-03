// src/stores/slices/effectsSlice.ts
import { StateCreator } from 'zustand';

// Tipuri pentru claritate
export type VisualEffect = 'none' | 'pulse' | 'ripple';

export interface EffectsSlice {
  activeEffect: VisualEffect;
  particlesEnabled: boolean;
  setActiveEffect: (effect: VisualEffect) => void;
  setParticlesEnabled: (enabled: boolean) => void;
}

const createEffectsSlice: StateCreator<EffectsSlice> = (set) => ({
  activeEffect: 'none', // Implicit: niciun efect
  particlesEnabled: true, // Implicit: particule activate
  setActiveEffect: (effect) => set({ activeEffect: effect }),
  setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
});

export default createEffectsSlice;