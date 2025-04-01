// effects/pulseEffect.js
export function pulseEffect(data, i, frame) {
  const flicker = Math.sin(frame * 0.3) * 10
  data[i] = Math.min(255, data[i] + flicker)
  data[i + 1] = Math.min(255, data[i + 1] + flicker)
  data[i + 2] = Math.min(255, data[i + 2] + flicker)
}
