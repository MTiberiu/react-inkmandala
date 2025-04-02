import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Raycaster, Vector2 } from 'three'
import Stats from 'stats.js'
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4']

// 🧠 FloodTask = un flood animat independent
class FloodTask {
  constructor(sharedImageData, ctx, x, y, fillColor, texture, batchSize = 20, effects = {}, onColorShift) {
    this.ctx = ctx
    this.texture = texture
    this.batchSize = batchSize
    this.canvasWidth = ctx.canvas.width
    this.canvasHeight = ctx.canvas.height
    this.onColorShift = onColorShift
    this.effects = effects
    this._hasShifted = false
   
  
    this.imgData = sharedImageData
    this.data = this.imgData.data
  
    const offset = (Math.floor(y) * this.canvasWidth + Math.floor(x)) * 4
    this.targetColor = this.data.slice(offset, offset + 3)
    this.visited = new Set()
  
    this.queue = []
    this.enqueue = (px, py) => {
      const dx = px - x
      const dy = py - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const jitter = Math.random() * 5
      const gravity = Math.max(0, dy * 0.3)
      const swirl = Math.sin((dx + dy) * 0.2) * 2
      const dist = distance + jitter + gravity + swirl
      this.queue.push({ x: px, y: py, dist })
    }
  
    this.enqueue(Math.floor(x), Math.floor(y))
  }
  

  matchColor(i) {
    return (
      Math.abs(this.data[i] - this.targetColor[0]) <= 32 &&
      Math.abs(this.data[i + 1] - this.targetColor[1]) <= 32 &&
      Math.abs(this.data[i + 2] - this.targetColor[2]) <= 32
    )
  }

  setColor(i, fillColor) {
    this.data[i] = fillColor[0]
    this.data[i + 1] = fillColor[1]
    this.data[i + 2] = fillColor[2]
    this.data[i + 3] = 255
  }

  step(fillColor, currentEffects = {}) {
    this._frameCount = (this._frameCount || 0) + 1
    let count = 0
    this.queue.sort((a, b) => a.dist - b.dist)
  
    let lastX = null
    let lastY = null
  
    while (this.queue.length > 0 && count < this.batchSize) {
      const { x: cx, y: cy } = this.queue.shift()
      const i = (cy * this.canvasWidth + cx) * 4
      if (!this.matchColor(i) || this.visited.has(i)) continue
  
      this.setColor(i, fillColor)
      this.visited.add(i)
      count++
  
      lastX = cx
      lastY = cy
  
      // Pulse
      if (this.effects?.pulse) {
        const pulse = Math.floor(Math.sin(this._frameCount * 0.2) * 100)
        this.data[i] = Math.min(255, this.data[i] + pulse)
        this.data[i + 1] = Math.max(0, this.data[i + 1] - pulse)
        this.data[i + 2] = Math.max(0, this.data[i + 2] - pulse)
      }
  
      // Ripple
      if (this.effects?.ripple) {
        const ripple = Math.floor(Math.sin((cx + cy) * 0.15 + this._frameCount * 0.5) * 120)
        this.data[i + 2] = Math.min(255, this.data[i + 2] + ripple)
      }
  
      // Propagare
      if (cx > 0) this.enqueue(cx - 1, cy)
      if (cx < this.canvasWidth - 1) this.enqueue(cx + 1, cy)
      if (cy > 0) this.enqueue(cx, cy - 1)
      if (cy < this.canvasHeight - 1) this.enqueue(cx, cy + 1)
    }
  
    // Efect pentru particule
    if (this.onColorShift && !this._hasShifted && lastX !== null && lastY !== null) {
      const worldX = (lastX / this.canvasWidth - 0.5) * 10
      const worldY = (0.5 - lastY / this.canvasHeight) * 10
      this.onColorShift(worldX, worldY, fillColor)
      this._hasShifted = true
    }
    

    
  
    const updated = new ImageData(this.data, this.canvasWidth, this.canvasHeight)
    this.ctx.putImageData(updated, 0, 0)
    this.texture.needsUpdate = true
  
    return this.queue.length > 0
  }
  
  
  
  
  
}

const PaintLayer = ({ imageUrl, effects, onColorShift }) => {
  const meshRef = useRef()
  const activeFloodsRef = useRef([])
  const sharedImageDataRef = useRef(null)

  const { gl, camera } = useThree()
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [isReady, setIsReady] = useState(false)

  // 🎨 Canvas & textură
  const { canvas, context, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    return { canvas, context, texture }
  }, [])

  // 🖼️ Încarcă imaginea
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
    
      const targetWidth = 10
      const aspect = img.height / img.width
      setSize({ width: targetWidth, height: targetWidth * aspect })
    
      context.drawImage(img, 0, 0)
    
      // ✅ Warmup call
      try {
        context.getImageData(0, 0, 1, 1)
        console.log('✅ getImageData warmup OK')
      } catch (e) {
        console.warn('⚠️ getImageData warmup failed', e)
      }
    
      // 🧠 Save shared image data
      sharedImageDataRef.current = context.getImageData(0, 0, canvas.width, canvas.height)
    
      texture.needsUpdate = true
      setIsReady(true)
    }
    
  }, [imageUrl])

  // 🎨 Convertor HEX → RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0]
  }

  // 🌀 Loop global pentru toate flood-urile active
// 🌀 Loop global pentru toate flood-urile active
useEffect(() => {
  if (!isReady) return;

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const loop = () => {
    stats.begin();

    // 🔥 Transmitem efectele curente în fiecare frame!
    activeFloodsRef.current = activeFloodsRef.current.filter((task) =>
      task.step(task.fillColor, effects)
    );

    stats.end();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}, [isReady, effects]); // 👈 E VITAL să adaugi effects aici!


  // 🖱️ Click = adăugăm un flood nou
  useEffect(() => {
    if (!isReady) return
  
    const handleClick = (event) => {
      console.log('👀 EFFECTS LA CLICK:', effects) // ← Acum va merge!
  
      const bounds = gl.domElement.getBoundingClientRect()
      const ndc = new Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      )
  
      const raycaster = new Raycaster()
      raycaster.setFromCamera(ndc, camera)
      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects.length === 0) return
  
      const uv = intersects[0].uv
      if (!uv) return
  
      const x = uv.x * canvas.width
      const y = (1 - uv.y) * canvas.height
  
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const rgb = hexToRgb(color)
  
      const task = new FloodTask(
        sharedImageDataRef.current,
        context,
        x,
        y,
        rgb,
        texture,
        20,
        effects,
        onColorShift
      )
      task.fillColor = rgb
      activeFloodsRef.current.push(task)
    }
  
    gl.domElement.addEventListener('mousedown', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [gl, camera, isReady, canvas, context, texture, effects]) // ← adaugă `effects` aici!
  

  if (!isReady) return null

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[size.width, size.height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

export default PaintLayer