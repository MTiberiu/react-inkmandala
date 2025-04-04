// src/components/colorapp/PaintLayer.jsx

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import useCanvasTextureLoader from '../../hooks/useCanvasTextureLoader';
import useAnimatedFills from '../../hooks/useAnimatedFills';
import usePaintInteraction from '../../hooks/usePaintInteraction';
import { FloodTask } from '../../features/coloring/FloodTask'; // Asigură-te că importul FloodTask este corect

// Presupunem că ai mutat aceste funcții sau le-ai redenumit/creat în DrawUtils
// Dacă sunt încă în floodFillUtils, ajustează calea importului.
import { performDirectFloodFill, mergeImageData } from '../../features/coloring/DrawUtils'; // [source: 201, 277, 301] sau ajustează calea

// hexToRgb nu mai este necesar aici dacă usePaintInteraction îl gestionează
// import { hexToRgb } from '../../utils/colorUtils';

// Redenumim prop-ul pentru claritate
const PaintLayer = ({ imageUrl, activeEffect, selectedPaintMode, onColorShift }) => {
  const meshRef = useRef();
  const { gl, camera } = useThree();

  // Hook Canvas/Textură - expune sharedImageDataRef și texture
  const { canvas, context, texture, size, isReady, sharedImageDataRef } = useCanvasTextureLoader(imageUrl); // [source: 203, 375-388]

  // --- Funcția de Commit Task (rămâne la fel) ---
  const commitTaskResult = useCallback((task) => {
      // console.log("Attempting commit for task ", task); // Debug
      if (task && sharedImageDataRef?.current && task.visited && task.visited.size > 0) {
           // console.log("Committing task with visited pixels:", task.visited.size); // Debug
           mergeImageData(sharedImageDataRef.current, task.imgData, task.visited); // [source: 204]
           // Nu mai actualizăm textura aici, bucla de animație sau logica de stop se ocupă
           return true; // Indică succes
      }
      return false; // Nu s-a făcut commit
  }, [sharedImageDataRef, mergeImageData]); // Eliminat context, texture din deps aici, mergeImageData e importat

  // Hook Animații (primește funcția de commit și selectedPaintMode)
  const { addAnimatedTask, activeFloodsRef } = useAnimatedFills(
      isReady, selectedPaintMode, context, texture, sharedImageDataRef, commitTaskResult // [source: 206, 350-374]
  );

  // --- Callback-uri pentru usePaintInteraction (rămân similare) ---
  const handleDirectFillTrigger = useCallback((clickData) => {
      if (!sharedImageDataRef.current || !context || !texture) return;

      // --- Oprește și Comite task-urile existente ÎNAINTE de fill ---
      let committedSomething = false;
      activeFloodsRef.current.forEach(task => {
           if(commitTaskResult(task)) { // [source: 207]
               committedSomething = true;
           }
           task.signalStop(); // [source: 102, 329]
      });
      activeFloodsRef.current = []; // Golește array-ul [source: 150]

      // Actualizează textura O DATĂ dacă s-a făcut commit la ceva
      if (committedSomething && context && texture && sharedImageDataRef.current) {
            context.putImageData(sharedImageDataRef.current, 0, 0); // [source: 209]
            texture.needsUpdate = true; // [source: 209]
      }
      // --------------------------------------------------------------

      // Execută fill direct pe starea (posibil actualizată)
      performDirectFloodFill(sharedImageDataRef.current, context, texture, clickData.x_canvas, clickData.y_canvas, clickData.rgb); // [source: 209]

  }, [context, texture, sharedImageDataRef, activeFloodsRef, commitTaskResult, performDirectFloodFill]); // Adăugat performDirectFloodFill la deps

  const handleAnimatedFillTrigger = useCallback((clickData) => {
    if (!sharedImageDataRef.current || !context || !texture) return null;
    // Creează o copie a ImageData pentru noul task
    const taskImageData = new ImageData( new Uint8ClampedArray(sharedImageDataRef.current.data), sharedImageDataRef.current.width, sharedImageDataRef.current.height ); // [source: 162]
    // Creează task-ul
    const task = new FloodTask(taskImageData, context, clickData.x_canvas, clickData.y_canvas, clickData.rgb, texture, 40, activeEffect); // [source: 163, 310-349]
    if (task.queue.length > 0) {
        addAnimatedTask(task); // Adaugă la hook-ul de animație [source: 164]
        return task; // Returnează task-ul (folosit de HOLD_AND_RELEASE)
    }
    return null;
  }, [context, texture, sharedImageDataRef, activeEffect, addAnimatedTask]); // Dependințe corecte

  // Hook Interacțiuni - acum primește și sharedImageDataRef, texture
  usePaintInteraction(
      isReady, gl, camera, meshRef, canvas,
      selectedPaintMode, // Prop actualizat
      onColorShift,
      handleDirectFillTrigger,
      handleAnimatedFillTrigger,
      // --- Props noi pasate pentru modul DRAW ---
      sharedImageDataRef,
      texture,
      context 
      // --------------------------------------
  ); // [source: 211, 390-415]

  // --- Cleanup Principal la Schimbarea Modului sau Demontare (rămâne similar) ---
   useEffect(() => {
        // Se execută când se schimbă selectedPaintMode sau la demontare
        return () => {
             // console.log(`PaintLayer Cleanup for mode: ${selectedPaintMode}`); // Debug
             let committedSomething = false;
             if (sharedImageDataRef.current) { // Verifică dacă ref există
                  activeFloodsRef.current.forEach(task => {
                      if(commitTaskResult(task)) { // Comite task-urile animate rămase [source: 213]
                          committedSomething = true;
                      }
                      task.signalStop(); // [source: 214]
                 });
                 // Actualizează textura finală dacă s-a comit ceva din taskuri animate
                 if (committedSomething && context && texture) {
                     context.putImageData(sharedImageDataRef.current, 0, 0); // [source: 214]
                     texture.needsUpdate = true; // [source: 215]
                 }
             }
             activeFloodsRef.current = []; // Golește array-ul de task-uri animate [source: 215]
             // Hook-ul usePaintInteraction își face propriul cleanup pentru starea internă (isDrawingRef etc.)
        }
   // Dependențe pentru cleanup
   }, [selectedPaintMode, commitTaskResult, sharedImageDataRef, context, texture, activeFloodsRef]); // [source: 216]

  // Actualizare geometrie (rămâne la fel)
  useEffect(() => {
      if (isReady && meshRef.current && size) {
          // Creează o nouă geometrie când dimensiunea se schimbă
          meshRef.current.geometry = new THREE.PlaneGeometry(size.width, size.height); // [source: 217]
      }
  }, [isReady, size]);

  // --- Randare ---
  if (!isReady) return null; // Nu randa nimic dacă imaginea nu e încărcată

  return (
    // Poziționăm mesh-ul în scenă
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* Geometria este actualizată în useEffect */}
      <planeGeometry args={[size.width, size.height]} />
      {/* Materialul folosește textura dinamică actualizată */}
      <meshBasicMaterial
           key={texture.uuid} // Adăugarea unui key poate forța re-renderul materialului la schimbări majore de textură
           map={texture}
           transparent // Permite transparența din imaginea PNG
           toneMapped={false} // Important pentru culori fidele în colorare
           side={THREE.DoubleSide} // Opțional, depinde dacă vrei să vezi planul din spate
      />
    </mesh> // [source: 218]
  );
};

export default PaintLayer;