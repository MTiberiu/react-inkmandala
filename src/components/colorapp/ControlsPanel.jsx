import React from 'react'
import "./ControlsPanel.css"
const ControlsPanel = ({ activeEffect, setActiveEffect,
  particlesEnabled, setParticlesEnabled,
  selectedFloodType, setFloodType,
  requestClear   }) => {
  const toggle = (key) =>
    setEffects((prev) => ({ ...prev, [key]: !prev[key] }))
// Funcție pentru a schimba starea particulelor
const handleEffectChange = (event) => setActiveEffect(event.target.value);
const handleFloodTypeChange = (event) => setFloodType(event.target.value);
const handleParticleToggle = (event) => setParticlesEnabled(event.target.checked);
  return (
    <div className='controls-container'>
    {/* Secțiune Efecte Vizuale */}
    <fieldset>
      <legend>Visual Effect</legend>
      {['none', 'pulse', 'ripple'].map(effect => (
        <div key={effect}>
          <label>
            <input
              type="radio"
              name="visualEffect"
              value={effect}
              checked={activeEffect === effect}
              onChange={handleEffectChange}
            />
            {effect.charAt(0).toUpperCase() + effect.slice(1)} {/* Capitalize */}
          </label>
        </div>
      ))}
    </fieldset>

    {/* Secțiune Tip Flood Fill */}
    <fieldset>
      <legend>Flood Fill Type</legend>
       {['DIRECT', 'ANIMATED', 'HOLD_AND_RELEASE'].map(type => (
         <div key={type}>
           <label>
             <input
               type="radio"
               name="floodType"
               value={type}
               checked={selectedFloodType === type}
               onChange={handleFloodTypeChange}
             />
              {/* Poți pune nume mai prietenoase aici */}
             {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
           </label>
         </div>
       ))}
    </fieldset>

    {/* Secțiune Particule */}
    <fieldset>
      <legend>Particles</legend>
      <label>
        <input
          type="checkbox"
          checked={particlesEnabled}
          onChange={handleParticleToggle}
        />
        Particle Explosion on Click
      </label>
    </fieldset>
     {/* --- Butonul de Clear --- */}
+     <div> {/* Poți ajusta stilizarea */}
+         <button onClick={requestClear} title="Clear all coloring">
+             Clear Canvas
+             {/* Poți adăuga un SVG icon aici dacă vrei */}
+         </button>
+     </div>
  </div>
  )
}

export default ControlsPanel
