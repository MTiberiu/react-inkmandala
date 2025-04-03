// src/components/colorapp/Particles.jsx
// --- Încercare efect Curgere/Stropire V3 (pornind de la original, focus pe vizibilitate) ---

import React, { useRef, useImperativeHandle, forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const MAX = 500; // Nr maxim particule

const Particles = forwardRef((props, ref) => {
  const meshRef = useRef()
  const positions = useMemo(() => new Float32Array(MAX * 3), [])
  const colors = useMemo(() => new Float32Array(MAX * 3), [])
  const lifetimes = useMemo(() => new Float32Array(MAX), [])
  // *** Modificare: Adaugă vz ***
  const velocities = useRef(new Array(MAX).fill(null).map(() => ({ vx: 0, vy: 0, vz: 0 })));
  const indexRef = useRef(0) // 👉 index ciclic pentru particule

  useImperativeHandle(ref, () => ({
    spawnBurst(x, y, [r, g, b]) {
      const particleCount = 50; // Numărul original

      for (let j = 0; j < particleCount; j++) {
        const idx = indexRef.current++ % MAX
        const angle = Math.random() * Math.PI * 2
        // *** Modificare: Viteze ajustate ***
        const speedXY = Math.random() * 0.1 + 0.05; // Viteză XY redusă
        const speedZ = -(Math.random() * 0.2 + 0.1); // Viteză Z INIȚIALĂ mică spre plan

        // *** Modificare: Poziție Z inițială mai în față ***
        const initialZ = 0.5; // Pornim de la 0.5 (poți încerca și 1.0)

        positions[idx * 3] = x
        positions[idx * 3 + 1] = y
        positions[idx * 3 + 2] = initialZ // Setăm Z inițial

        // Setăm vitezele (inclusiv Z)
        velocities.current[idx].vx = Math.cos(angle) * speedXY
        velocities.current[idx].vy = Math.sin(angle) * speedXY
        velocities.current[idx].vz = speedZ // Setăm viteza Z

        // Culoare
        colors[idx * 3] = r / 255
        colors[idx * 3 + 1] = g / 255
        colors[idx * 3 + 2] = b / 255

        // Durată viață originală (sau ușor mărită)
        lifetimes[idx] = 1.2 + Math.random() * 0.3; // 1.2s - 1.5s
      }

      // Update buffere
      if (meshRef.current?.geometry) { // Verificare bună
        meshRef.current.geometry.attributes.position.needsUpdate = true
        meshRef.current.geometry.attributes.color.needsUpdate = true
      }
    }
  }))

  useFrame((_, delta) => {
    if (!meshRef.current?.geometry) return;
    let positionNeedsUpdate = false;
    let colorNeedsUpdate = false;

    for (let i = 0; i < MAX; i++) {
      const idx = i * 3
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta

        if (lifetimes[i] <= 0) {
          // Ascunde la expirare (metoda originală)
          positions[idx + 2] = -10
          velocities.current[i] = { vx: 0, vy: 0, vz: 0 };
          positionNeedsUpdate = true;
          continue;
        }

        // Actualizează poziția X, Y, Z
        positions[idx] += velocities.current[i].vx * delta
        positions[idx + 1] += velocities.current[i].vy * delta
        positions[idx + 2] += velocities.current[i].vz * delta // <- Mișcare pe Z (fără gravitație)

        // Estompare culoare (original)
        colors[idx] *= 0.96;
        colors[idx + 1] *= 0.96;
        colors[idx + 2] *= 0.96;

        positionNeedsUpdate = true;
        colorNeedsUpdate = true;
      }
      // Clauza 'else' pentru Z=-10 este implicită în logica de mai sus
    }

    // Update GPU
    if (positionNeedsUpdate) meshRef.current.geometry.attributes.position.needsUpdate = true;
    if (colorNeedsUpdate) meshRef.current.geometry.attributes.color.needsUpdate = true;
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        {/* Setăm usage explicit pentru bufferele dinamice */}
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={MAX} usage={THREE.DynamicDrawUsage} />
        <bufferAttribute attach="attributes-color" array={colors} itemSize={3} count={MAX} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      {/* Folosim materialul original, dar mărim size */}
      <pointsMaterial
          size={8} // Mărime mai mare pentru vizibilitate
          sizeAttenuation={true}
          vertexColors={true}
          transparent={true} // Păstrăm transparența
          opacity={1.0} // Opacitate maximă inițial
          // depthWrite={false} // Poți încerca și cu true/false dacă tot nu se văd
       />
    </points>
  )
})

export default Particles;