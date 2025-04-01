import React from 'react'

const ControlsPanel = ({ effects, setEffects }) => {
  const toggle = (key) =>
    setEffects((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div style={{
      
      padding: '1rem', borderRadius: 8, zIndex: 10
    }}>
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
