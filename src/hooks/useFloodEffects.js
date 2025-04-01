// hooks/useFloodEffects.js
import { useState } from 'react'

export default function useFloodEffects() {
  const [effects, setEffects] = useState({
    pulse: false,
    ripple: false
  })

  const toggle = (key) => {
    setEffects((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return { effects, toggle }
}
