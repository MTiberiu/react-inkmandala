import React, { useRef, useImperativeHandle, forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const MAX = 500

const Particles = forwardRef((props, ref) => {
  const meshRef = useRef()
  const positions = useMemo(() => new Float32Array(MAX * 3), [])
  const colors = useMemo(() => new Float32Array(MAX * 3), [])
  const lifetimes = useMemo(() => new Float32Array(MAX), [])
  const velocities = useRef(new Array(MAX).fill().map(() => ({ vx: 0, vy: 0 })))
  const indexRef = useRef(0) // 👉 index ciclic pentru particule

  useImperativeHandle(ref, () => ({
    spawnBurst(x, y, [r, g, b]) {
      for (let j = 0; j < 50; j++) {
        const idx = indexRef.current++ % MAX
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 0.3 + 0.1

        positions[idx * 3] = x
        positions[idx * 3 + 1] = y
        positions[idx * 3 + 2] = 0.05

        velocities.current[idx].vx = Math.cos(angle) * speed
        velocities.current[idx].vy = Math.sin(angle) * speed

        colors[idx * 3] = r / 255
        colors[idx * 3 + 1] = g / 255
        colors[idx * 3 + 2] = b / 255

        lifetimes[idx] = 1
      }

      meshRef.current.geometry.attributes.position.needsUpdate = true
      meshRef.current.geometry.attributes.color.needsUpdate = true
    }
  }))

  useFrame((_, delta) => {
    for (let i = 0; i < MAX; i++) {
      const idx = i * 3
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta
        const fade = Math.max(0, lifetimes[i])

        positions[idx] += velocities.current[i].vx * delta
        positions[idx + 1] += velocities.current[i].vy * delta
        // z constant pentru plane-ul 2D
        positions[idx + 2] = 0.05

        colors[idx] *= 0.96
        colors[idx + 1] *= 0.96
        colors[idx + 2] *= 0.96
      } else {
        positions[idx + 2] = -10 // 🙈 scoatem particula din view
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.geometry.attributes.color.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={MAX} />
        <bufferAttribute attach="attributes-color" array={colors} itemSize={3} count={MAX} />
      </bufferGeometry>
      <pointsMaterial size={5} sizeAttenuation vertexColors transparent opacity={1.0} />
    </points>
  )
})

export default Particles
