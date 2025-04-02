import React from 'react'
import "./ControlsPanel.css"
const ControlsPanel = ({ effects, setEffects }) => {
  const toggle = (key) =>
    setEffects((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className='controls-container'>
      <label>
        <input
          type="checkbox"
          checked={effects.pulse}
          onChange={() => toggle('pulse')}
        />
        Pulse effect
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={effects.ripple}
          onChange={() => toggle('ripple')}
        />
        Ripple effect
      </label>
    </div>
  )
}

export default ControlsPanel
