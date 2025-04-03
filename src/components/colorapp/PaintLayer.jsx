// src/components/colorapp/PaintLayer.jsx

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';
// import Stats from 'stats.js'; // Poți decomenta pentru debug performanță

// --- Constante și Tipuri (pot fi importate dacă folosești TS) ---
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4'];
// Presupunem că tipurile sunt definite undeva global sau importate:
// type VisualEffect = 'none' | 'pulse' | 'ripple';
// type FloodType = 'DIRECT' | 'ANIMATED' | 'HOLD_AND_RELEASE';

// --- Funcția pentru Flood Fill Direct (Sincron) ---
function performDirectFloodFill(imageData, ctx, texture, startX, startY, fillColorRgb, tolerance = 20) {
  const canvasWidth = imageData.width;
  const canvasHeight = imageData.height;
  const data = imageData.data;
  const visited = new Set();
  const queue = [];

  const startNodeX = Math.floor(startX);
  const startNodeY = Math.floor(startY);

  if (startNodeX < 0 || startNodeX >= canvasWidth || startNodeY < 0 || startNodeY >= canvasHeight) return;

  const startOffset = (startNodeY * canvasWidth + startNodeX) * 4;

  // Verifică dacă punctul de start e transparent sau deja colorat (opțional, dar poate preveni umpleri nedorite)
  // if (data[startOffset + 3] < 128) return;

  const targetColor = data.slice(startOffset, startOffset + 3);

  function matchColor(offset) {
    if (data[offset + 3] < 128) return false; // Ignoră pixelii transparenți
    return (
      Math.abs(data[offset] - targetColor[0]) <= tolerance &&
      Math.abs(data[offset + 1] - targetColor[1]) <= tolerance &&
      Math.abs(data[offset + 2] - targetColor[2]) <= tolerance
    );
  }

  function setColor(offset) {
    data[offset] = fillColorRgb[0];
    data[offset + 1] = fillColorRgb[1];
    data[offset + 2] = fillColorRgb[2];
    data[offset + 3] = 255;
  }

  if (!matchColor(startOffset)) return; // Nu începe dacă punctul de start nu corespunde

  queue.push({ x: startNodeX, y: startNodeY });
  visited.add(startOffset);

  let iterations = 0;
  const maxIterations = canvasWidth * canvasHeight; // O limită rezonabilă

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const { x: cx, y: cy } = queue.shift();
    const currentOffset = (cy * canvasWidth + cx) * 4;

    setColor(currentOffset); // Culoarea se setează aici (match a fost la adăugare)

    const neighbors = [ { x: cx, y: cy - 1 }, { x: cx, y: cy + 1 }, { x: cx - 1, y: cy }, { x: cx + 1, y: cy } ];

    for (const neighbor of neighbors) {
      const { x: nx, y: ny } = neighbor;
      if (nx >= 0 && nx < canvasWidth && ny >= 0 && ny < canvasHeight) {
        const neighborOffset = (ny * canvasWidth + nx) * 4;
        if (!visited.has(neighborOffset) && matchColor(neighborOffset)) {
          visited.add(neighborOffset);
          queue.push(neighbor);
        }
      }
    }
  }
   if (iterations >= maxIterations) console.warn("Direct Flood Fill reached max iterations limit.");

  // Actualizează canvas-ul și textura O SINGURĂ DATĂ
  ctx.putImageData(imageData, 0, 0);
  texture.needsUpdate = true;
}


// --- Clasa FloodTask Modificată ---
class FloodTask {
  constructor(sharedImageData, ctx, x, y, fillColor, texture, batchSize = 40, activeEffect = 'none') {
    this.ctx = ctx;
    this.texture = texture;
    this.batchSize = batchSize;
    this.canvasWidth = ctx.canvas.width;
    this.canvasHeight = ctx.canvas.height;
    this.activeEffect = activeEffect;
    this.fillColor = fillColor;
    this.imgData = sharedImageData; // Utilizează copia ImageData primită
    this.data = this.imgData.data;
    this.shouldStop = false;
    this._frameCount = 0;
    this.visited = new Set();
    this.queue = [];
    this.targetColor = [];

    const startXInt = Math.floor(x);
    const startYInt = Math.floor(y);
    this.startX = startXInt; // Stochează coordonata X inițială
    this.startY = startYInt; // Stochează coordonata Y inițială

    if (startXInt >= 0 && startXInt < this.canvasWidth && startYInt >= 0 && startYInt < this.canvasHeight) {
      const offset = (startYInt * this.canvasWidth + startXInt) * 4;
      // Verifică dacă punctul de start e transparent
      if(this.data[offset + 3] >= 128) {
        this.targetColor = this.data.slice(offset, offset + 3);
        this.enqueue(startXInt, startYInt);
      } else {
         console.log("FloodTask: Start point is transparent, task not started.");
         this.queue = []; // Golește coada dacă startul e invalid
      }
    } else {
      console.warn("FloodTask: Start point out of bounds.");
       this.queue = [];
    }
  }

  signalStop() { this.shouldStop = true; }

  enqueue = (px, py) => {
      const dx = px - this.startX;
      const dy = py - this.startY;
      // Simplificăm calculul distanței pentru sortare, putem reveni la cel complex dacă dorim
      const dist = Math.sqrt(dx * dx + dy * dy) + Math.random() * 5;
      this.queue.push({ x: px, y: py, dist });
  };

  matchColor(i) {
    if (this.data[i + 3] < 128) return false; // Ignoră transparența
    const tolerance = 32;
    return (
      Math.abs(this.data[i] - this.targetColor[0]) <= tolerance &&
      Math.abs(this.data[i + 1] - this.targetColor[1]) <= tolerance &&
      Math.abs(this.data[i + 2] - this.targetColor[2]) <= tolerance
    );
  }

  setColor(i) {
    this.data[i] = this.fillColor[0];
    this.data[i + 1] = this.fillColor[1];
    this.data[i + 2] = this.fillColor[2];
    this.data[i + 3] = 255;
  }

  step() {
    if (this.shouldStop) return false;
    if (this.queue.length === 0) {
        // Asigură un ultim update la finalizare naturală dacă s-au făcut modificări
        if (this.visited.size > 0) {
            this.ctx.putImageData(this.imgData, 0, 0);
            this.texture.needsUpdate = true;
        }
        return false;
    }


    this._frameCount++;
    let count = 0;
    this.queue.sort((a, b) => a.dist - b.dist); // Menține sortarea pentru efect

    let pixelsChangedInBatch = false;

    while (this.queue.length > 0 && count < this.batchSize) {
      const { x: cx, y: cy } = this.queue.shift();
      const i = (cy * this.canvasWidth + cx) * 4;

      if (cx < 0 || cx >= this.canvasWidth || cy < 0 || cy >= this.canvasHeight || !this.matchColor(i) || this.visited.has(i)) {
        continue;
      }

      this.setColor(i);
      this.visited.add(i);
      count++;
      pixelsChangedInBatch = true; // Marcam ca am modificat ceva

      // --- Aplică Efectele Vizuale Active ---
      if (this.activeEffect === 'pulse') {
        const pulse = Math.floor(Math.sin(this._frameCount * 0.2) * 40);
        this.data[i] = Math.min(255, Math.max(0, this.data[i] + pulse));
        this.data[i + 1] = Math.min(255, Math.max(0, this.data[i + 1] - pulse));
        this.data[i + 2] = Math.min(255, Math.max(0, this.data[i + 2] - pulse));
      } else if (this.activeEffect === 'ripple') {
        const ripple = Math.floor(Math.sin((cx + cy) * 0.15 + this._frameCount * 0.5) * 50);
        this.data[i + 2] = Math.min(255, Math.max(0, this.data[i + 2] + ripple));
      }

      // Propagare
      this.enqueue(cx - 1, cy);
      this.enqueue(cx + 1, cy);
      this.enqueue(cx, cy - 1);
      this.enqueue(cx, cy + 1);
    }

    // Actualizează doar dacă s-au modificat pixeli în acest batch
    if (pixelsChangedInBatch) {
        this.ctx.putImageData(this.imgData, 0, 0);
        this.texture.needsUpdate = true;
    }

    return this.queue.length > 0; // Continuă dacă mai sunt elemente în coadă
  }
}


// --- Componenta Principală PaintLayer ---
const PaintLayer = ({ imageUrl, activeEffect, selectedFloodType, onColorShift }) => {
  const meshRef = useRef();
  const activeFloodsRef = useRef([]);
  const sharedImageDataRef = useRef(null); // Va stoca starea curentă a imaginii
  const activeTaskRef = useRef(null);
  const stopTimerRef = useRef(null);

  const { gl, camera } = useThree();
  const [size, setSize] = useState({ width: 10, height: 10 });
  const [isReady, setIsReady] = useState(false);

  // Inițializare Canvas & Textură
  const { canvas, context, texture } = useMemo(() => {
    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return { canvas: cvs, context: ctx, texture: tex };
  }, []);

  // Încărcare Imagine și Inițializare Stare
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (!isMounted) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const targetWidth = 10;
      const aspect = img.naturalHeight / img.naturalWidth;
      setSize({ width: targetWidth, height: targetWidth * aspect });
      context.drawImage(img, 0, 0);
      try { context.getImageData(0, 0, 1, 1); } catch (e) { console.warn('getImageData warmup failed', e); }
      // Inițializează sharedImageDataRef cu starea inițială a imaginii
      sharedImageDataRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
      setIsReady(true);
    };
    img.onerror = () => { if (isMounted) console.error("Failed image load:", imageUrl); };
    return () => { isMounted = false; };
  }, [imageUrl, canvas, context, texture]);

  // Conversie Culoare
  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
  }, []);

  // Bucla de Animație (doar pentru task-uri animate)
  useEffect(() => {
    if (!isReady || (selectedFloodType !== 'ANIMATED' && selectedFloodType !== 'HOLD_AND_RELEASE')) {
      return; // Nu rulează bucla
    }
    // const stats = new Stats(); stats.showPanel(0); document.body.appendChild(stats.dom); // Debug
    let animationFrameId = null;
    const loop = () => {
      // stats.begin(); // Debug
      // Procesează și filtrează task-urile
      activeFloodsRef.current = activeFloodsRef.current.filter((task) => {
           const shouldContinue = task.step();
           // Dacă task-ul s-a terminat, actualizăm sharedImageDataRef cu rezultatul lui
           if (!shouldContinue && task.visited.size > 0) { // Verificăm dacă a făcut ceva
                sharedImageDataRef.current = task.imgData; // Salvăm rezultatul task-ului terminat
           }
           return shouldContinue;
       });

      // stats.end(); // Debug
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      // if (stats.dom.parentElement) { document.body.removeChild(stats.dom); } // Debug
    };
  }, [isReady, selectedFloodType]);


  // --- Gestionarea Evenimentelor (Centralizată) ---
  useEffect(() => {
    if (!isReady) return;

    const domElement = gl.domElement;

    const handleRaycast = (event) => {
      // ... (logica handleRaycast existentă) ...
       const bounds = domElement.getBoundingClientRect();
       const ndc = new Vector2(
           ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
           -((event.clientY - bounds.top) / bounds.height) * 2 + 1
       );
       const raycaster = new Raycaster();
       raycaster.setFromCamera(ndc, camera);
       const intersects = raycaster.intersectObject(meshRef.current);
       if (intersects.length === 0) return null;
       const intersectionPoint = intersects[0].point;
       const uv = intersects[0].uv;
       if (!uv || !intersectionPoint) return null;
       const x_canvas = uv.x * canvas.width;
       const y_canvas = (1 - uv.y) * canvas.height;
       const color = COLORS[Math.floor(Math.random() * COLORS.length)];
       const rgb = hexToRgb(color);
       return { x_canvas, y_canvas, rgb, intersectionPoint };
    };

    // Handler pentru 'DIRECT'
    const handleDirectFill = (event) => {
      if (!sharedImageDataRef.current) return;
      const clickData = handleRaycast(event);
      if (!clickData) return;
      if (onColorShift) { // Particule
        onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, clickData.rgb);
      }
      // Execută fill direct pe STAREA CURENTĂ din sharedImageDataRef
      performDirectFloodFill(sharedImageDataRef.current, context, texture, clickData.x_canvas, clickData.y_canvas, clickData.rgb);
      // sharedImageDataRef este deja modificat in-place de funcție, nu mai trebuie reasignat.
    };

    // Handler pentru start 'ANIMATED' / 'HOLD_AND_RELEASE'
    const handleAnimatedFillStart = (event) => {
       if (!sharedImageDataRef.current) return;

       // Oprește task/timer anterior pentru HOLD_AND_RELEASE
       if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
       if (activeTaskRef.current) activeTaskRef.current.signalStop();
       stopTimerRef.current = null;
       activeTaskRef.current = null;

       const clickData = handleRaycast(event);
       if (!clickData) return;

       if (onColorShift) { // Particule
           onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, clickData.rgb);
       }

       // Important: Creează task-ul cu o COPIE a stării curente a imaginii
       const taskImageData = new ImageData(
           new Uint8ClampedArray(sharedImageDataRef.current.data),
           sharedImageDataRef.current.width,
           sharedImageDataRef.current.height
       );
       const task = new FloodTask(
           taskImageData, context, clickData.x_canvas, clickData.y_canvas,
           clickData.rgb, texture, 40, activeEffect
       );

        // Adaugă la animație doar dacă task-ul a pornit valid (nu pe transparent/out of bounds)
        if (task.queue.length > 0) {
           activeFloodsRef.current.push(task);
           if (selectedFloodType === 'HOLD_AND_RELEASE') {
               activeTaskRef.current = task;
           }
        }
    };

    // Handler pentru end 'HOLD_AND_RELEASE'
    const handleHoldAndReleaseEnd = () => {
       if (activeTaskRef.current && !stopTimerRef.current) {
           const taskToStop = activeTaskRef.current;
           const delaySeconds = 0.1;
           stopTimerRef.current = setTimeout(() => {
               if (taskToStop) taskToStop.signalStop();
               stopTimerRef.current = null;
               if (activeTaskRef.current === taskToStop) activeTaskRef.current = null;
           }, delaySeconds * 1000);
       }
    };

    // Atașare/Detașare Listeneri
    let clickHandler = null;
    let pointerDownHandler = null;
    let pointerUpHandler = null;
    let pointerLeaveHandler = null;

    if (selectedFloodType === 'DIRECT') {
        clickHandler = handleDirectFill;
        domElement.addEventListener('click', clickHandler);
    } else if (selectedFloodType === 'ANIMATED') {
        pointerDownHandler = handleAnimatedFillStart;
        domElement.addEventListener('pointerdown', pointerDownHandler);
    } else if (selectedFloodType === 'HOLD_AND_RELEASE') {
        pointerDownHandler = handleAnimatedFillStart;
        pointerUpHandler = handleHoldAndReleaseEnd;
        pointerLeaveHandler = handleHoldAndReleaseEnd;
        domElement.addEventListener('pointerdown', pointerDownHandler);
        window.addEventListener('pointerup', pointerUpHandler);
        window.addEventListener('pointerleave', pointerLeaveHandler);
    }

    // Cleanup
    return () => {
        if (clickHandler) domElement.removeEventListener('click', clickHandler);
        if (pointerDownHandler) domElement.removeEventListener('pointerdown', pointerDownHandler);
        if (pointerUpHandler) window.removeEventListener('pointerup', pointerUpHandler);
        if (pointerLeaveHandler) window.removeEventListener('pointerleave', pointerLeaveHandler);
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        // Nu mai oprim task-ul activ la cleanup neapărat, lăsăm timer-ul să decidă
    };

  }, [ isReady, gl, camera, canvas, context, texture, selectedFloodType, activeEffect, onColorShift, hexToRgb ]); // Atenție la dependențe!

  // --- Randare ---
  if (!isReady) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[size.width, size.height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

export default PaintLayer;