// src/stores/appStore.ts
import { create } from 'zustand';
import createEffectsSlice, { EffectsSlice } from './slices/effectsSlice';
import createToolSlice, { ToolSlice } from './slices/toolSlice';

// Combină tipurile slice-urilor pentru tipul global al stării
type AppState = EffectsSlice & ToolSlice;

// Creează hook-ul principal al store-ului
const useAppStore = create<AppState>()((...args) => ({
  ...createEffectsSlice(...args),
  ...createToolSlice(...args),
}));

export default useAppStore;