// src/components/colorapp/PaletteDisplay.tsx
import React from 'react';
import useAppStore from '../../stores/appStore';
import './PaletteDisplay.css'; // Vom crea acest fișier imediat

const PaletteDisplay: React.FC = () => {
  // Citim stările și acțiunile necesare din store
  const activePaletteName = useAppStore((state) => state.activePaletteName);
  const palettes = useAppStore((state) => state.palettes);
  const selectedColor = useAppStore((state) => state.selectedColor);
  const setSelectedColor = useAppStore((state) => state.setSelectedColor);
  const removeColorFromPalette = useAppStore((state) => state.removeColorFromPalette);
  // Obținem culorile din paleta activă. Folosim un array gol ca fallback.
  const activeColors = palettes[activePaletteName] || [];
  const isDefaultPalette = activePaletteName === 'Default'; // Verificăm dacă e paleta Default
  const handleRemoveClick = (event: React.MouseEvent, colorToRemove: string) => {
    event.stopPropagation(); // Previne ca și click-ul pe swatch să se propage
    removeColorFromPalette(activePaletteName, colorToRemove);
};
  return (
    <div className="palette-section">
      <h5>{activePaletteName} Palette</h5> {/* Afișăm numele paletei active */}
      <div className="palette-display">
      {activeColors.map((color) => (
          // ++ Înfășurăm în container ++
          <div key={color} className="swatch-container">
            <button
              className={`color-swatch ${selectedColor.toLowerCase() === color.toLowerCase() ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Select color ${color}`}
              title={color}
            />
            {/* ++ Butonul de ștergere (doar dacă NU e paleta Default) ++ */}
            {!isDefaultPalette && (
                <button
                    className="delete-swatch-button"
                    onClick={(e) => handleRemoveClick(e, color)}
                    aria-label={`Remove color ${color}`}
                    title={`Remove ${color}`}
                >
                    &times; {/* Caracterul 'x' (times) */}
                </button>
            )}
            {/* ---------------------------------------------------------- */}
          </div>
          // ----------------------------
        ))}
        {activeColors.length === 0 && (
             <p style={{fontSize: '0.8em', color: '#888'}}>Palette is empty.</p>
         )}
      </div>
    </div>
  );
};

export default PaletteDisplay;