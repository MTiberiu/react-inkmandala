// src/stores/slices/colorSlice.ts
import { StateCreator } from 'zustand';

// Tip pentru palete: un obiect unde cheia este numele paletei (string)
// și valoarea este un array de string-uri (culori hex)
export type Palettes = Record<string, string[]>;
const PALETTE_STORAGE_KEY = 'inkmandala_user_palettes';
// ++ Cheie nouă pentru culori recente ++
const RECENT_COLORS_STORAGE_KEY = 'inkmandala_recent_colors';
// ------------------------------------
const MAX_RECENT_COLORS = 10; // Setează limita dorită

const defaultPalettes: Palettes = {
  'Default': ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4', '#FFFFFF', '#000000']
};

// Interfața definește structura acestui slice
export interface ColorSlice {
  selectedColor: string;
  activePaletteName: string;
  palettes: Palettes;
  // ++ Adaugă starea pentru culori recente ++
  recentlyUsedColors: string[];
  // ---------------------------------------
  setSelectedColor: (color: string) => void;
  setActivePaletteName: (name: string) => void;
  addPalette: (name: string) => void;
  addColorToPalette: (paletteName: string, color: string) => void;
  loadPalettes: (loadedPalettes: Palettes) => void;
  removeColorFromPalette: (paletteName: string, colorToRemove: string) => void;
  // *** Asigură-te că această linie este prezentă în interfață ***
  removePalette: (paletteNameToRemove: string) => void;
  // *************************************************************
  // ++ Adaugă definiția acțiunii noi ++
  addRecentColor: (color: string) => void;
  // ---
}
// --- Funcții Helper pentru Persistență ---
const loadPersistedData = <T>(key: string, defaultValue: T): T => {
  try {
      const persistedState = localStorage.getItem(key);
      if (persistedState) {
          const parsedData = JSON.parse(persistedState);
          // Verificare simplă dacă tipul se potrivește (aproximativ)
          if (typeof parsedData === typeof defaultValue && (Array.isArray(defaultValue) === Array.isArray(parsedData))) {
               // Specific pentru palete, excludem Default
               if(key === PALETTE_STORAGE_KEY && typeof parsedData === 'object' && parsedData !== null) {
                   delete parsedData['Default'];
               }
              return parsedData as T;
          }
      }
  } catch (e) {
      console.error(`Failed to load or parse ${key} from localStorage`, e);
  }
  return defaultValue; // Returnează valoarea default dacă nu există/e invalid
};

const saveData = <T>(key: string, data: T) => {
   try {
      let dataToSave = data;
       // Specific pentru palete, excludem Default la salvare
      if(key === PALETTE_STORAGE_KEY && typeof data === 'object' && data !== null) {
          dataToSave = { ...(data as object) }; // Copie
          delete (dataToSave as any)['Default'];
      }
      localStorage.setItem(key, JSON.stringify(dataToSave));
   } catch (e) {
       console.error(`Failed to save ${key} to localStorage`, e);
   }
};
// ---------------------------------------

const savePalettes = (palettes: Palettes) => {
  try {
    const palettesToSave = { ...palettes };
    delete palettesToSave['Default'];
    localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(palettesToSave));
  } catch (e) {
    console.error("Failed to save palettes to localStorage", e);
  }
};

// Funcția care creează efectiv slice-ul
const createColorSlice: StateCreator<ColorSlice> = (set, get) => {
  // ++ Încărcăm AMBELE tipuri de date ++
  const loadedCustomPalettes = loadPersistedData<Palettes>(PALETTE_STORAGE_KEY, {});
  const loadedRecentColors = loadPersistedData<string[]>(RECENT_COLORS_STORAGE_KEY, []);
  // --
  const initialPalettes = { ...defaultPalettes, ...loadedCustomPalettes };
  const initialActivePalette = 'Default';

  // Returnează obiectul stării + acțiunile
  return {
    selectedColor: defaultPalettes['Default'][0] || '#FF6B6B',
    activePaletteName: initialActivePalette,
    palettes: initialPalettes,
    // ++ Inițializăm starea nouă ++
    recentlyUsedColors: loadedRecentColors,
    // 

    setSelectedColor: (color) => set({ selectedColor: color }),

    setActivePaletteName: (name) => {
      if (get().palettes[name]) {
        set({ activePaletteName: name });
      } else {
        console.warn(`Palette "${name}" not found.`);
      }
    },

    addPalette: (name) => {
      const trimmedName = name.trim();
      if (trimmedName && !get().palettes[trimmedName]) {
        set((state) => ({
          palettes: {
            ...state.palettes,
            [trimmedName]: []
          }
        }));
        savePalettes(get().palettes);
      } else {
        console.warn(`Palette name "${trimmedName}" is invalid or already exists.`);
      }
    },

    addColorToPalette: (paletteName, color) => {
      if (paletteName === 'Default') {
        console.warn("Cannot add colors to the Default palette.");
        return;
      }
      if (get().palettes[paletteName]) {
        set((state) => {
          const currentPalette = state.palettes[paletteName] || [];
          if (currentPalette.includes(color)) {
            return state;
          }
          return {
            palettes: {
              ...state.palettes,
              [paletteName]: [...currentPalette, color]
            }
          };
        });
        if(get().palettes[paletteName]){
           savePalettes(get().palettes);
        }
      } else {
         console.warn(`Cannot add color to non-existent palette "${paletteName}".`);
      }
    },

    loadPalettes: (loadedPalettes) => {
      set((state) => ({
        palettes: {
          ...state.palettes,
          ...loadedPalettes
        }
      }));
      // O lăsăm fără save aici, încărcarea e la inițializare
    },

    removeColorFromPalette: (paletteName, colorToRemove) => {
      if (paletteName === 'Default') {
        console.warn("Cannot remove colors from the Default palette.");
        return;
      }
      if (get().palettes[paletteName]) {
        set((state) => {
          const currentPalette = state.palettes[paletteName] || [];
          const updatedColors = currentPalette.filter(
            (color) => color.toLowerCase() !== colorToRemove.toLowerCase()
          );
          if (updatedColors.length === currentPalette.length) {
            return state;
          }
          return {
            palettes: {
              ...state.palettes,
              [paletteName]: updatedColors
            }
          };
        });
        if(get().palettes[paletteName]){
           savePalettes(get().palettes);
        }
      } else {
        console.warn(`Cannot remove color from non-existent palette "${paletteName}".`);
      }
    },

    // *** Asigură-te că această implementare este prezentă ***
    removePalette: (paletteNameToRemove) => {
      if (paletteNameToRemove === 'Default') {
        console.warn("Cannot remove the Default palette.");
        return;
      }
      if (get().palettes[paletteNameToRemove]) {
        set((state) => {
          const newPalettes = { ...state.palettes };
          delete newPalettes[paletteNameToRemove];
          let newActivePaletteName = state.activePaletteName;
          if (state.activePaletteName === paletteNameToRemove) {
            newActivePaletteName = 'Default';
          }
          return {
            palettes: newPalettes,
            activePaletteName: newActivePaletteName
          };
        });
        savePalettes(get().palettes);
      } else {
        console.warn(`Cannot remove non-existent palette "${paletteNameToRemove}".`);
      }
    },
    // ******************************************************
     // ++ Implementarea acțiunii noi ++
     addRecentColor: (color) => {
      set((state) => {
          // 1. Filtrează culoarea existentă (insensibil la majuscule/minuscule)
          const filteredRecent = state.recentlyUsedColors.filter(
              c => c.toLowerCase() !== color.toLowerCase()
          );
          // 2. Adaugă noua culoare la început
          const newRecentColors = [color, ...filteredRecent];
          // 3. Limitează la MAX_RECENT_COLORS
          const limitedRecentColors = newRecentColors.slice(0, MAX_RECENT_COLORS);

          // Returnează noua stare
          return { recentlyUsedColors: limitedRecentColors };
      });
      // ** Salvează după actualizare **
      saveData(RECENT_COLORS_STORAGE_KEY, get().recentlyUsedColors);
  },
  // -----------------------------------
  };
};

export default createColorSlice;