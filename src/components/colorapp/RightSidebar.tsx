// src/components/colorapp/RightSidebar.tsx
import React from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import useAppStore from '../../stores/appStore';
import PaletteDisplay from './PaletteDisplay'; 
import PaletteManager from './PaletteManager';
import './RightSidebar.css';

const RightSidebar: React.FC = () => {
  const selectedColor = useAppStore((state) => state.selectedColor);
  const setSelectedColor = useAppStore((state) => state.setSelectedColor);

  const handleColorChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
  };

  return (
    <aside className="right-sidebar">
      <h4>Select Color</h4>
      <SketchPicker
        color={selectedColor}
        onChangeComplete={handleColorChange}
        disableAlpha={true}
        presetColors={[]}
        width="240px"
      />

      <hr />
      <PaletteDisplay />
      <PaletteManager />
    </aside>
  );
};

export default RightSidebar;