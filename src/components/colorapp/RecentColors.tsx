// src/components/colorapp/RecentColors.tsx
import React from 'react';
import useAppStore from '../../stores/appStore';
import './RecentColors.css'; // Vom crea acest fișier

const RecentColors: React.FC = () => {
  // Citim stările și acțiunile necesare
  const recentlyUsedColors = useAppStore((state) => state.recentlyUsedColors);
  const selectedColor = useAppStore((state) => state.selectedColor);
  const setSelectedColor = useAppStore((state) => state.setSelectedColor);

  // Nu afișăm nimic dacă lista e goală
  if (recentlyUsedColors.length === 0) {
    return null; // Sau un mesaj placeholder dacă preferi
  }

  return (
    <div className="recent-colors-section">
      <h6>Recently Used</h6> {/* Folosim h6 pentru ierarhie */}
      <div className="recent-swatches-container">
        {recentlyUsedColors.map((color) => (
          <button
            key={`recent-${color}`} // Adăugăm un prefix la cheie
            className={`recent-color-swatch ${selectedColor.toLowerCase() === color.toLowerCase() ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
            aria-label={`Select recent color ${color}`}
            title={color} // Tooltip cu valoarea hex
          />
        ))}
      </div>
    </div>
  );
};

export default RecentColors;