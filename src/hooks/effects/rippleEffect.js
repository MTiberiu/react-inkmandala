// effects/rippleEffect.js
export function rippleEffect(data, i, dist) {
  const mod = Math.sin(dist * 0.1) * 8
  data[i] = Math.min(255, data[i] + mod)
  data[i + 2] = Math.max(0, data[i + 2] - mod)
}
