import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Raycaster, Vector2 } from 'three'

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4']

const PaintLayer = ({ imageUrl }) => {
  const meshRef = useRef()
  const { gl, camera } = useThree()
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [isReady, setIsReady] = useState(false)

  // Setup canvas & texture
  const { canvas, context, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    return { canvas, context, texture }
  }, [])

  // Load image into canvas
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl
    img.onload = () => {
      console.log('🔄 Image loaded:', img.width, img.height)
      canvas.width = img.width
      canvas.height = img.height

      const targetWidth = 10
      const aspect = img.height / img.width
      setSize({ width: targetWidth, height: targetWidth * aspect })

      context.drawImage(img, 0, 0)
      texture.needsUpdate = true
      setIsReady(true)
    }
  }, [imageUrl])

  // Convert hex to [r, g, b]
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

  // Flood fill algo
  const floodFill = (ctx, x, y, fillColor, tolerance = 32) => {
    const canvasWidth = ctx.canvas.width
    const canvasHeight = ctx.canvas.height
    const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imgData.data
    const offset = (Math.floor(y) * canvasWidth + Math.floor(x)) * 4
    const targetColor = data.slice(offset, offset + 3)

    const matchColor = (i) =>
      Math.abs(data[i] - targetColor[0]) <= tolerance &&
      Math.abs(data[i + 1] - targetColor[1]) <= tolerance &&
      Math.abs(data[i + 2] - targetColor[2]) <= tolerance

    const setColor = (i) => {
      data[i] = fillColor[0]
      data[i + 1] = fillColor[1]
      data[i + 2] = fillColor[2]
      data[i + 3] = 255
    }

    if (!matchColor(offset)) return

    const stack = [[Math.floor(x), Math.floor(y)]]
    const visited = new Set()

    while (stack.length) {
      const [cx, cy] = stack.pop()
      const i = (cy * canvasWidth + cx) * 4
      if (!matchColor(i) || visited.has(i)) continue

      setColor(i)
      visited.add(i)

      if (cx > 0) stack.push([cx - 1, cy])
      if (cx < canvasWidth - 1) stack.push([cx + 1, cy])
      if (cy > 0) stack.push([cx, cy - 1])
      if (cy < canvasHeight - 1) stack.push([cx, cy + 1])
    }

    ctx.putImageData(imgData, 0, 0)
  }
  function floodFillAnimated(ctx, x, y, fillColor, texture, batchSize = 200) {
    const canvasWidth = ctx.canvas.width
    const canvasHeight = ctx.canvas.height
    const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imgData.data
    const offset = (Math.floor(y) * canvasWidth + Math.floor(x)) * 4
    const targetColor = data.slice(offset, offset + 3)
    const visited = new Set()
  
    const matchColor = (i) =>
      Math.abs(data[i] - targetColor[0]) <= 32 &&
      Math.abs(data[i + 1] - targetColor[1]) <= 32 &&
      Math.abs(data[i + 2] - targetColor[2]) <= 32
  
    const setColor = (i) => {
      data[i] = fillColor[0]
      data[i + 1] = fillColor[1]
      data[i + 2] = fillColor[2]
      data[i + 3] = 255
    }
  
    const queue = []
  
    // funcție helper pentru adăugare în coadă cu distanță față de centru
    // const enqueue = (px, py) => {
    //   const dx = px - x
    //   const dy = py - y
    //   const randomness = Math.random() * 8 // sau 10, sau 6 – joacă-te cu asta!
    //   const dist = Math.sqrt(dx * dx + dy * dy) + randomness
    //   queue.push({ x: px, y: py, dist })
    // }
    const enqueue = (px, py) => {
      const dx = px - x
      const dy = py - y
    
      const gravityBias = dy * 0.7 // mai mic în jos, mai mare în sus
      const randomness = Math.random() * 6
      const dist = Math.sqrt(dx * dx + dy * dy) + randomness - gravityBias
    
      queue.push({ x: px, y: py, dist })
    }
    
    enqueue(Math.floor(x), Math.floor(y))
  
    function step() {
      let count = 0
  
      // sortăm după distanță radială față de punctul de click
      queue.sort((a, b) => a.dist - b.dist)
  
      while (queue.length > 0 && count < batchSize) {
        const { x: cx, y: cy } = queue.shift()
        const i = (cy * canvasWidth + cx) * 4
  
        if (!matchColor(i) || visited.has(i)) continue
  
        setColor(i)
        visited.add(i)
        count++
  
        if (cx > 0) enqueue(cx - 1, cy)
        if (cx < canvasWidth - 1) enqueue(cx + 1, cy)
        if (cy > 0) enqueue(cx, cy - 1)
        if (cy < canvasHeight - 1) enqueue(cx, cy + 1)
      }
  
      ctx.putImageData(imgData, 0, 0)
      texture.needsUpdate = true
  
      if (queue.length > 0) {
        requestAnimationFrame(step)
      }
    }
  
    requestAnimationFrame(step)
  }
  
  
  // Click handler
  useEffect(() => {
    if (!isReady) return

    const handleClick = (event) => {
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
      console.log('🪣 Fill at:', Math.floor(x), Math.floor(y))

      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const rgb = hexToRgb(color)

      // floodFill(context, x, y, rgb)
      floodFillAnimated(context, x, y, rgb, texture)

      texture.needsUpdate = true
    }

    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [gl, camera, isReady, context, canvas, texture])

  if (!isReady) return null

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[size.width, size.height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

export default PaintLayer