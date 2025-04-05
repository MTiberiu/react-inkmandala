import Modal from '../Modal';
// src/components/colorapp/PaletteManager.tsx
import React, { useState } from 'react'; // <-- Importă useState
import useAppStore from '../../stores/appStore';
import './PaletteManager.css';

const PaletteManager: React.FC = () => {

  const palettes = useAppStore((state) => state.palettes);
  const activePaletteName = useAppStore((state) => state.activePaletteName);
  const setActivePaletteName = useAppStore((state) => state.setActivePaletteName);
  const selectedColor = useAppStore((state) => state.selectedColor);
  const addColorToPalette = useAppStore((state) => state.addColorToPalette);
  const addPalette = useAppStore((state) => state.addPalette);
  const removePalette = useAppStore((state) => state.removePalette);
  const [newPaletteName, setNewPaletteName] = useState<string>('');
  const isDefaultPaletteActive = activePaletteName === 'Default'; // Flag util
  const paletteNames = Object.keys(palettes);

  // ++ Stare nouă pentru vizibilitatea modalului de confirmare ++
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<boolean>(false);
  // 

  const handlePaletteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActivePaletteName(event.target.value);
  };

  const handleAddColorClick = () => {
    if (!activePaletteName || !selectedColor) return;
    addColorToPalette(activePaletteName, selectedColor);
  };

  // ++ Handler pentru input-ul de nume paletă nouă ++
  const handleNewPaletteNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewPaletteName(event.target.value);
  };
  // -----------------------------------------------

  // ++ Handler pentru crearea paletei noi ++
  const handleCreatePaletteClick = () => {
    const trimmedName = newPaletteName.trim(); // Elimină spații goale de la început/sfârșit
    if (!trimmedName) {
      alert("Please enter a name for the new palette."); // Sau o notificare mai elegantă
      return;
    }
    // Verifică dacă numele există deja (case-insensitive ar fi ideal, dar simplificăm)
    if (palettes[trimmedName]) {
        alert(`Palette "${trimmedName}" already exists.`);
        return;
    }

    addPalette(trimmedName);        // Adaugă paleta în store
    setActivePaletteName(trimmedName); // Setează noua paletă ca activă
    setNewPaletteName('');          // Golește input-ul
  };
  // ---------------------------------------
// ++ Handler pentru ștergerea paletei active ++
const handleDeletePaletteClick = () => {
  // Dublă verificare, deși butonul ar trebui să fie dezactivat
  if (isDefaultPaletteActive) return;
  setShowConfirmDeleteModal(true);
};

// ++ Handler pentru confirmarea ștergerii (din modal) ++
const handleConfirmDelete = () => {
  if (isDefaultPaletteActive) return; // Extra siguranță
  removePalette(activePaletteName);
  setShowConfirmDeleteModal(false); // Închide modalul după ștergere
};
// 

  // ++ Handler pentru anularea ștergerii (din modal) ++
  const handleCancelDelete = () => {
    setShowConfirmDeleteModal(false);
};
// ---------------------------------------------------


  return (
    <div className="palette-manager-section">
      <h4>Manage Palettes</h4>

      <div className="palette-selector">
        <label htmlFor="palette-select">Active Palette:</label>
        <select
          id="palette-select"
          value={activePaletteName}
          onChange={handlePaletteChange}
        >
          {paletteNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

     {/* Am pus ambele butoane în .palette-actions */}
     <div className="palette-actions">
          <button
              onClick={handleAddColorClick}
              title={`Add ${selectedColor} to ${activePaletteName} palette`}
              // Dezactivăm adăugarea la Default (opțional, acțiunea oricum previne)
              disabled={isDefaultPaletteActive}
          >
              Add Current Color
          </button>

          {/* ++ Butonul de ștergere paletă ++ */}
          <button
              className="delete-palette-button" // Clasă specifică pentru stilizare
              onClick={handleDeletePaletteClick}
              title={`Delete the "${activePaletteName}" palette`}
              // Dezactivăm dacă e selectată paleta Default
              disabled={isDefaultPaletteActive}
          >
              Delete Palette
          </button>
          {/* ----------------------------- */}
      </div>

      {/* ++ Secțiune pentru Creare Paletă Nouă ++ */}
      <div className="create-palette-section">
        <h5>Create New Palette</h5>
        <div className="create-palette-controls">
            <input
                type="text"
                placeholder="New palette name..."
                value={newPaletteName}
                onChange={handleNewPaletteNameChange}
                aria-label="New palette name"
            />
            <button onClick={handleCreatePaletteClick}>
                Create
            </button>
        </div>
      </div>
      {/* -------------------------------------- */}
      {/* ++ Randarea condiționată a Modalului de Confirmare ++ */}
      {showConfirmDeleteModal && (
        <Modal onClose={handleCancelDelete}> {/* La închidere ('x') anulează */}
          <div className="confirmation-dialog">
            <h4>Confirm Deletion</h4>
            <p>Are you sure you want to delete the palette named <strong>"{activePaletteName}"</strong>?</p>
            <p>This action cannot be undone.</p>
            <div className="confirmation-actions">
              <button onClick={handleCancelDelete} className="button-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="button-danger">
                Yes, Delete Palette
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* ---------------------------------------------------- */}

    </div>
  );
};

export default PaletteManager;