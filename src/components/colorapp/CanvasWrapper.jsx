import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import PaintLayer from './PaintLayer'

const CanvasWrapper = ({ imageUrl, effects  }) => {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 100, position: [0, 0, 10], near: 0.1, far: 1000 }}
      style={{ width: '100%', height: '100vh' }}
    >
      {/* 🔵 Fundal scenă (vizibil când e transparență) */}
      <color attach="background" args={['#eaeaea']} />

      {/* 💡 Lumină subtilă */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} castShadow />

      {/* 🔳 Plane de fundal vizual (mai mare și în spate) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial color="#f5f5f5" />
      </mesh>

      {/* 🧩 Componenta de colorat */}
      <PaintLayer imageUrl={imageUrl} effects={effects} />

      {/* Ghid vizual & OrbitControls */}
      <Grid sectionColor="#bbb" cellColor="#ddd" infiniteGrid={false} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport labelColor="black" axisHeadScale={1} />
      </GizmoHelper>
      <OrbitControls />
    </Canvas>
  )
}

export default CanvasWrapper
