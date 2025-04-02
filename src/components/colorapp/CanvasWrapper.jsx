// CanvasWrapper.jsx
import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import PaintLayer from './PaintLayer'
import Particles from './Particles'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'

const CanvasWrapper = ({ imageUrl, effects }) => {
  const particlesRef = useRef()

  return (
    <Canvas
      orthographic
      camera={{ zoom: 100, position: [0, 0, 10] }}
      style={{ width: '100%', height: '100%' }}
    >
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
  <GizmoViewport labelColor="black" axisHeadScale={1} />
</GizmoHelper>
<OrbitControls />
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <Particles ref={particlesRef} />
<PaintLayer
  imageUrl={imageUrl}
  effects={effects}
  onColorShift={(x, y, color) => {
    console.log('🎯 Trigger particule:', x, y, color)
    particlesRef.current?.spawnBurst(x, y, color)
  }}
/>

      <OrbitControls />
      <axesHelper args={[5]} />
    </Canvas>
  )
}

export default CanvasWrapper
