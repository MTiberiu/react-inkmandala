// src/stores/appStore.ts
import { create } from 'zustand';
import createEffectsSlice, { EffectsSlice } from './slices/effectsSlice';
import createToolSlice, { ToolSlice } from './slices/toolSlice';
import createColorSlice, { ColorSlice } from './slices/colorSlice';

// Combină tipurile slice-urilor pentru tipul global al stării
type AppState = EffectsSlice & ToolSlice &  ColorSlice;

// Creează hook-ul principal al store-ului
const useAppStore = create<AppState>()((...args) => ({
  ...createEffectsSlice(...args),
  ...createToolSlice(...args),
  ...createColorSlice(...args)
}));

export default useAppStore;