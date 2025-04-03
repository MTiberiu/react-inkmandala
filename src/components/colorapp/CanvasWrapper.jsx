// src/components/colorapp/CanvasWrapper.jsx
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import PaintLayer from './PaintLayer';
import Particles from './Particles';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three'; // <--- Importă THREE

const CanvasWrapper = ({ imageUrl, activeEffect, particlesEnabled, selectedFloodType }) => {
  const particlesRef = useRef();

  return (
    <Canvas
      orthographic
      camera={{ zoom: 100, position: [0, 0, 10] }}
      style={{ width: '100%', height: '100%' }}>

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport labelColor="black" axisHeadScale={1} />
      </GizmoHelper>

      {/* --- Modificarea OrbitControls --- */}
      <OrbitControls
        enablePan={true}    // Permite pan (implicit: Middle Mouse sau Shift+Left)
        enableZoom={true}   // Permite zoom (Scroll sau Pinch)
        enableRotate={true} // Permite rotația în general
        enableDamping={true}
        dampingFactor={1}

        // Re-mapează butoanele mouse-ului
        mouseButtons={{
          LEFT: null,                // <--- Dezactivează complet acțiunea pentru Click Stânga Apăsat + Mișcare
          MIDDLE: THREE.MOUSE.PAN,                           // Alternativ: THREE.MOUSE.PAN dacă vrei pan cu stânga
          // MIDDLE: THREE.MOUSE.DOLLY,  Click Mijloc pentru Zoom (Dolly)
          RIGHT: THREE.MOUSE.ROTATE  // <--- Click Dreapta pentru Rotire
        }}

        // Opțional: Configurează touch pentru mobil
        touches={{
           ONE: THREE.TOUCH.PAN,     // Un deget = Pan
           TWO: THREE.TOUCH.DOLLY_ROTATE // Două degete = Zoom și Rotire
         }}
         zoomToCursor={true}
      />
      {/* --------------------------------- */}

      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <Particles ref={particlesRef} />
      <PaintLayer
        imageUrl={imageUrl}
        activeEffect={activeEffect}
        selectedFloodType={selectedFloodType}
        onColorShift={(x, y, color) => {
          // console.log('🎯 Trigger particule:', x, y, color); // Păstrează sau șterge log-ul
          if (particlesEnabled) {
            particlesRef.current?.spawnBurst(x, y, color);
          }
        }}
      />

      {/* Elimină OrbitControls și axesHelper duplicate dacă existau */}
      {/* <OrbitControls /> */}
      {/* <axesHelper args={[5]} /> */}
    </Canvas>
  );
};

export default CanvasWrapper;