// src/components/colorapp/PaintLayer.jsx

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Raycaster, Vector2 } from 'three';
// import Stats from 'stats.js';

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4'];
// type VisualEffect = 'none' | 'pulse' | 'ripple'; // Presumed types
// type FloodType = 'DIRECT' | 'ANIMATED' | 'HOLD_AND_RELEASE'; // Presumed types

// --- Funcția pentru Flood Fill Direct (Sincron) ---
// (Implementarea funcției performDirectFloodFill rămâne la fel ca în răspunsul anterior)
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
    if (data[startOffset + 3] < 128) return; // Ignore transparent start
    const targetColor = data.slice(startOffset, startOffset + 3);
    function matchColor(offset) {
        if (data[offset + 3] < 128) return false;
        return (
            Math.abs(data[offset] - targetColor[0]) <= tolerance &&
            Math.abs(data[offset + 1] - targetColor[1]) <= tolerance &&
            Math.abs(data[offset + 2] - targetColor[2]) <= tolerance );
    }
    function setColor(offset) {
        data[offset] = fillColorRgb[0]; data[offset + 1] = fillColorRgb[1];
        data[offset + 2] = fillColorRgb[2]; data[offset + 3] = 255; }
    if (!matchColor(startOffset)) return;
    queue.push({ x: startNodeX, y: startNodeY });
    visited.add(startOffset);
    let iterations = 0; const maxIterations = canvasWidth * canvasHeight;
    while (queue.length > 0 && iterations < maxIterations) {
        iterations++; const { x: cx, y: cy } = queue.shift();
        const currentOffset = (cy * canvasWidth + cx) * 4;
        setColor(currentOffset);
        const neighbors = [ { x: cx, y: cy - 1 }, { x: cx, y: cy + 1 }, { x: cx - 1, y: cy }, { x: cx + 1, y: cy } ];
        for (const neighbor of neighbors) { const { x: nx, y: ny } = neighbor;
            if (nx >= 0 && nx < canvasWidth && ny >= 0 && ny < canvasHeight) {
                const neighborOffset = (ny * canvasWidth + nx) * 4;
                if (!visited.has(neighborOffset) && matchColor(neighborOffset)) {
                    visited.add(neighborOffset); queue.push(neighbor); }
            }
        }
    }
    if (iterations >= maxIterations) console.warn("Direct Flood Fill limit reached.");
    ctx.putImageData(imageData, 0, 0); texture.needsUpdate = true;
}


// --- Clasa FloodTask Modificată ---
// (Rămâne la fel ca în răspunsul anterior, cu signalStop, aplicare efecte etc.)
class FloodTask {
    // ... (constructor, signalStop, enqueue, matchColor, setColor, step) ...
    // Asigură-te că 'step' modifică doar this.imgData și returnează true/false
    // Implementarea exactă din răspunsul anterior este bună.
    constructor(sharedImageData, ctx, x, y, fillColor, texture, batchSize = 40, activeEffect = 'none') {
        this.ctx = ctx; this.texture = texture; this.batchSize = batchSize;
        this.canvasWidth = ctx.canvas.width; this.canvasHeight = ctx.canvas.height;
        this.activeEffect = activeEffect; this.fillColor = fillColor;
        this.imgData = sharedImageData; this.data = this.imgData.data;
        this.shouldStop = false; this._frameCount = 0; this.visited = new Set();
        this.queue = []; this.targetColor = [];
        const startXInt = Math.floor(x); const startYInt = Math.floor(y);
        this.startX = startXInt; this.startY = startYInt;
        if (startXInt >= 0 && startXInt < this.canvasWidth && startYInt >= 0 && startYInt < this.canvasHeight) {
            const offset = (startYInt * this.canvasWidth + startXInt) * 4;
            if(this.data[offset + 3] >= 128) {
                this.targetColor = this.data.slice(offset, offset + 3); this.enqueue(startXInt, startYInt);
            } else { this.queue = []; }
        } else { this.queue = []; }
    }
    signalStop() { this.shouldStop = true; }
    enqueue = (px, py) => { const dx = px - this.startX; const dy = py - this.startY;
        const dist = Math.sqrt(dx * dx + dy * dy) + Math.random() * 5; this.queue.push({ x: px, y: py, dist }); };
    matchColor(i) { if (this.data[i + 3] < 128) return false; const tolerance = 32;
        return ( Math.abs(this.data[i] - this.targetColor[0]) <= tolerance &&
            Math.abs(this.data[i + 1] - this.targetColor[1]) <= tolerance &&
            Math.abs(this.data[i + 2] - this.targetColor[2]) <= tolerance ); }
    setColor(i) { this.data[i] = this.fillColor[0]; this.data[i + 1] = this.fillColor[1];
        this.data[i + 2] = this.fillColor[2]; this.data[i + 3] = 255; }
    step() {
        if (this.shouldStop || this.queue.length === 0) return false;
        this._frameCount++; let count = 0; this.queue.sort((a, b) => a.dist - b.dist);
        let pixelsChangedInBatch = false;
        while (this.queue.length > 0 && count < this.batchSize) {
            const { x: cx, y: cy } = this.queue.shift(); const i = (cy * this.canvasWidth + cx) * 4;
            if (cx < 0 || cx >= this.canvasWidth || cy < 0 || cy >= this.canvasHeight || !this.matchColor(i) || this.visited.has(i)) continue;
            this.setColor(i); this.visited.add(i); count++; pixelsChangedInBatch = true;
            if (this.activeEffect === 'pulse') { const pulse = Math.floor(Math.sin(this._frameCount * 0.2) * 40);
                this.data[i] = Math.min(255, Math.max(0, this.data[i] + pulse)); this.data[i + 1] = Math.min(255, Math.max(0, this.data[i + 1] - pulse));
                this.data[i + 2] = Math.min(255, Math.max(0, this.data[i + 2] - pulse));
            } else if (this.activeEffect === 'ripple') { const ripple = Math.floor(Math.sin((cx + cy) * 0.15 + this._frameCount * 0.5) * 50);
                this.data[i + 2] = Math.min(255, Math.max(0, this.data[i + 2] + ripple)); }
            this.enqueue(cx - 1, cy); this.enqueue(cx + 1, cy); this.enqueue(cx, cy - 1); this.enqueue(cx, cy + 1);
        }
        // NU actualizăm context/texture aici, doar returnăm starea
        return this.queue.length > 0;
    }
}


// --- Componenta Principală PaintLayer ---
const PaintLayer = ({ imageUrl, activeEffect, selectedFloodType, onColorShift }) => {
  const meshRef = useRef();
  const activeFloodsRef = useRef([]);
  const sharedImageDataRef = useRef(null); // Starea "master" a imaginii
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
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
    return { canvas: cvs, context: ctx, texture: tex };
  }, []);

  // Încărcare Imagine
  useEffect(() => {
    // ... (Logica de încărcare imagine și inițializare sharedImageDataRef - la fel ca înainte) ...
        let isMounted = true; const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = imageUrl;
        img.onload = () => { if (!isMounted) return; canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
            const targetWidth = 10; const aspect = img.naturalHeight / img.naturalWidth; setSize({ width: targetWidth, height: targetWidth * aspect });
            context.drawImage(img, 0, 0); try { context.getImageData(0, 0, 1, 1); } catch (e) { console.warn('getImageData warmup failed', e); }
            sharedImageDataRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
            texture.needsUpdate = true; setIsReady(true); };
        img.onerror = () => { if (isMounted) console.error("Failed image load:", imageUrl); };
        return () => { isMounted = false; };
  }, [imageUrl, canvas, context, texture]);

  // Conversie Culoare
  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
  }, []);

  // --- Bucla de Animație Modificată (pentru Compositing Vizual) ---
  useEffect(() => {
    if (!isReady || (selectedFloodType !== 'ANIMATED' && selectedFloodType !== 'HOLD_AND_RELEASE')) {
      return; // Nu rulează bucla
    }

    let animationFrameId = null;

    const loop = () => {
      if (!sharedImageDataRef.current) { // Verificare suplimentară
           animationFrameId = requestAnimationFrame(loop);
           return;
      }

      // 1. Creează o copie a stării de bază pentru acest frame
      const baseImageData = sharedImageDataRef.current;
      const frameImageData = new ImageData(
          new Uint8ClampedArray(baseImageData.data), // Copie buffer date
          baseImageData.width,
          baseImageData.height
      );

      let textureNeedsUpdateThisFrame = false;

      // 2. Procesează task-urile și aplică modificările lor pe copia frame-ului
      activeFloodsRef.current = activeFloodsRef.current.filter((task) => {
        const shouldContinue = task.step(); // Task-ul își modifică propriul task.imgData

        if (task.visited.size > 0) { // Aplică modificări doar dacă task-ul a făcut ceva
             // Combină rezultatul task-ului PESTE imaginea frame-ului curent
             const taskData = task.imgData.data;
             const frameData = frameImageData.data;
             for (const pixelIndex of task.visited) { // Iterează prin pixelii vizitați de task
                  if(pixelIndex+3 < frameData.length && pixelIndex+3 < taskData.length) {
                       frameData[pixelIndex]     = taskData[pixelIndex];     // R
                       frameData[pixelIndex + 1] = taskData[pixelIndex + 1]; // G
                       frameData[pixelIndex + 2] = taskData[pixelIndex + 2]; // B
                       frameData[pixelIndex + 3] = taskData[pixelIndex + 3]; // A
                  }
             }
             textureNeedsUpdateThisFrame = true; // Marcam ca textura trebuie actualizată
         }


        // Dacă task-ul s-a terminat, imprimă rezultatul final în starea master
        if (!shouldContinue && task.visited.size > 0) {
          // console.log("Task finished, merging into shared state."); // Debug
          mergeImageData(sharedImageDataRef.current, task.imgData, task.visited);
           // Nu mai e nevoie de update la textură aici, se face mai jos cu frameImageData
        }

        return shouldContinue; // Păstrează task-ul în array dacă trebuie să continue
      });

      // 3. Actualizează contextul și textura DOAR O DATĂ pe frame, dacă e necesar
      if (textureNeedsUpdateThisFrame) {
        context.putImageData(frameImageData, 0, 0);
        texture.needsUpdate = true;
      }

      animationFrameId = requestAnimationFrame(loop); // Continuă bucla
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => { // Cleanup
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isReady, selectedFloodType, context, texture]); // Adaugă context, texture ca dependențe


  // --- Funcția de Merge (Definită în Scope) ---
  const mergeImageData = useCallback((baseImageData, overlayImageData, visitedPixels) => {
      if (!baseImageData || !overlayImageData || !visitedPixels) return;
      const baseData = baseImageData.data;
      const overlayData = overlayImageData.data;
      for (const pixelIndex of visitedPixels) {
          if(pixelIndex+3 < baseData.length && pixelIndex+3 < overlayData.length) {
              baseData[pixelIndex]     = overlayData[pixelIndex];
              baseData[pixelIndex + 1] = overlayData[pixelIndex + 1];
              baseData[pixelIndex + 2] = overlayData[pixelIndex + 2];
              baseData[pixelIndex + 3] = overlayData[pixelIndex + 3];
          }
      }
      // Nu returnează nimic, modifică baseImageData in-place
  }, []); // useCallback pentru stabilitate dacă e folosită în alte dependențe


  // --- Gestionarea Evenimentelor (cu Merge la Stop) ---
  useEffect(() => {
    if (!isReady) return;
    const domElement = gl.domElement;

    // --- Funcția stopAndClearAnimatedTasks Modificată ---
    const stopAndClearAnimatedTasks = () => {
        if (sharedImageDataRef.current) {
            activeFloodsRef.current.forEach(task => {
                if (task.visited && task.visited.size > 0) {
                    // Combină rezultatul parțial în starea master ÎNAINTE de a opri
                    mergeImageData(sharedImageDataRef.current, task.imgData, task.visited);
                }
                task.signalStop();
            });
             // Actualizează textura finală după toate merge-urile
            context.putImageData(sharedImageDataRef.current, 0, 0);
            texture.needsUpdate = true;
        } else {
             activeFloodsRef.current.forEach(task => task.signalStop());
        }
        activeFloodsRef.current = []; // Golește array-ul
        if (activeTaskRef.current) activeTaskRef.current = null;
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
    };
    // ----------------------------------------------------

    // Funcția handleRaycast (rămâne la fel)
    const handleRaycast = (event) => { /* ... implementare existentă ... */
         const bounds = domElement.getBoundingClientRect();
         const ndc = new Vector2(
             ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
             -((event.clientY - bounds.top) / bounds.height) * 2 + 1
         );
         const raycaster = new Raycaster(); raycaster.setFromCamera(ndc, camera);
         const intersects = raycaster.intersectObject(meshRef.current); if (intersects.length === 0) return null;
         const intersectionPoint = intersects[0].point; const uv = intersects[0].uv; if (!uv || !intersectionPoint) return null;
         const x_canvas = uv.x * canvas.width; const y_canvas = (1 - uv.y) * canvas.height;
         const color = COLORS[Math.floor(Math.random() * COLORS.length)]; const rgb = hexToRgb(color);
         return { x_canvas, y_canvas, rgb, intersectionPoint };
    };

    // Handler 'DIRECT' (modificat să oprească animațiile *înainte*)
    const handleDirectFill = (event) => {
      if (!sharedImageDataRef.current) return;
      const clickData = handleRaycast(event); if (!clickData) return;
      stopAndClearAnimatedTasks(); // Oprește și comite animațiile existente
      if (onColorShift) onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, clickData.rgb);
      performDirectFloodFill(sharedImageDataRef.current, context, texture, clickData.x_canvas, clickData.y_canvas, clickData.rgb);
    };

    // Handler start 'ANIMATED' / 'HOLD_AND_RELEASE' (modificat să nu mai oprească toate taskurile)
    const handleAnimatedFillStart = (event) => {
       if (!sharedImageDataRef.current) return;
       // Oprește doar task-ul/timer-ul specific HOLD... precedent
       if (selectedFloodType === 'HOLD_AND_RELEASE') {
           if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
           // Nu oprim task-ul aici, timer-ul/cleanup-ul o va face
           stopTimerRef.current = null;
           // Nu resetăm activeTaskRef aici, poate fi suprascris
       }
       const clickData = handleRaycast(event); if (!clickData) return;
       if (onColorShift) onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, clickData.rgb);
       const taskImageData = new ImageData( new Uint8ClampedArray(sharedImageDataRef.current.data), sharedImageDataRef.current.width, sharedImageDataRef.current.height );
       const task = new FloodTask( taskImageData, context, clickData.x_canvas, clickData.y_canvas, clickData.rgb, texture, 40, activeEffect );
       if (task.queue.length > 0) {
           activeFloodsRef.current.push(task);
           if (selectedFloodType === 'HOLD_AND_RELEASE') {
                // Dacă există deja un task activ HOLD, îl oprim și comitem înainte de a-l suprascrie
                if (activeTaskRef.current && activeTaskRef.current !== task) {
                     if (activeTaskRef.current.visited && activeTaskRef.current.visited.size > 0) {
                          mergeImageData(sharedImageDataRef.current, activeTaskRef.current.imgData, activeTaskRef.current.visited);
                          // Poate un update de textură aici? Nu, bucla de animație o face.
                     }
                     activeTaskRef.current.signalStop();
                }
               activeTaskRef.current = task; // Suprascrie sau setează noul task activ
           }
       }
    };

    // Handler end 'HOLD_AND_RELEASE' (rămâne la fel)
    const handleHoldAndReleaseEnd = () => { /* ... implementare existentă, cu delaySeconds = 0.5 ... */
       if (activeTaskRef.current && !stopTimerRef.current) {
           const taskToStop = activeTaskRef.current; const delaySeconds = 0.5;
           stopTimerRef.current = setTimeout(() => {
               if (taskToStop) {
                   taskToStop.signalStop();
                    // Aici NU mai facem merge, bucla de animație face merge când task-ul e filtrat
               }
               stopTimerRef.current = null;
               if (activeTaskRef.current === taskToStop) activeTaskRef.current = null;
           }, delaySeconds * 1000);
       }
    };

    // Atașare Listeneri (la fel)
    let clickHandler = null, pointerDownHandler = null, pointerUpHandler = null, pointerLeaveHandler = null;
    if (selectedFloodType === 'DIRECT') { clickHandler = handleDirectFill; domElement.addEventListener('click', clickHandler); }
    else if (selectedFloodType === 'ANIMATED') { pointerDownHandler = handleAnimatedFillStart; domElement.addEventListener('pointerdown', pointerDownHandler); }
    else if (selectedFloodType === 'HOLD_AND_RELEASE') {
        pointerDownHandler = handleAnimatedFillStart; pointerUpHandler = handleHoldAndReleaseEnd; pointerLeaveHandler = handleHoldAndReleaseEnd;
        domElement.addEventListener('pointerdown', pointerDownHandler); window.addEventListener('pointerup', pointerUpHandler); window.addEventListener('pointerleave', pointerLeaveHandler); }

    // Cleanup (modificat să folosească noua stopAndClear)
    return () => {
        if (clickHandler) domElement.removeEventListener('click', clickHandler);
        if (pointerDownHandler) domElement.removeEventListener('pointerdown', pointerDownHandler);
        if (pointerUpHandler) window.removeEventListener('pointerup', pointerUpHandler);
        if (pointerLeaveHandler) window.removeEventListener('pointerleave', pointerLeaveHandler);
        stopAndClearAnimatedTasks(); // Comite starea task-urilor la cleanup/schimbare mod
    };

  }, [ isReady, gl, camera, canvas, context, texture, selectedFloodType, activeEffect, onColorShift, hexToRgb, mergeImageData ]); // Adaugă mergeImageData la dependențe


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