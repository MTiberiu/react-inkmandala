// src/components/colorapp/PaintLayer.jsx

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import useCanvasTextureLoader from '../../hooks/useCanvasTextureLoader';
import useAnimatedFills from '../../hooks/useAnimatedFills';
import usePaintInteraction from '../../hooks/usePaintInteraction';
import { FloodTask } from '../../features/coloring/FloodTask';
import { performDirectFloodFill, mergeImageData } from '../../features/coloring/floodFillUtils';
import { hexToRgb } from '../../utils/colorUtils';

const PaintLayer = ({ imageUrl, activeEffect, selectedFloodType, onColorShift }) => {
  const meshRef = useRef();
  const { gl, camera } = useThree();

  // Hook Canvas/Textură
  const { canvas, context, texture, size, isReady, sharedImageDataRef } = useCanvasTextureLoader(imageUrl);

  // --- Funcția de Commit Task (definită aici, pasată la hook-uri) ---
   const commitTaskResult = useCallback((task) => {
        // console.log("Attempting commit for task ", task); // Debug
        if (task && sharedImageDataRef?.current && task.visited && task.visited.size > 0) {
             // console.log("Committing task with visited pixels:", task.visited.size); // Debug
             mergeImageData(sharedImageDataRef.current, task.imgData, task.visited);
             // Nu mai actualizăm textura aici, bucla de animație sau logica de stop se ocupă
             return true; // Indică succes
        }
        return false; // Nu s-a făcut commit
    }, [sharedImageDataRef, context, texture, mergeImageData]); // Dependențe stabile

  // Hook Animații (primește funcția de commit)
  const { addAnimatedTask, activeFloodsRef } = useAnimatedFills(
      isReady, selectedFloodType, context, texture, sharedImageDataRef, commitTaskResult
  );

  // --- Callback-uri pentru usePaintInteraction ---
  const handleDirectFillTrigger = useCallback((clickData) => {
      if (!sharedImageDataRef.current || !context || !texture) return;

      // --- Oprește și Comite task-urile existente ÎNAINTE de fill ---
      let committedSomething = false;
      activeFloodsRef.current.forEach(task => {
           // Folosim commitTaskResult și verificăm dacă a returnat true
           if(commitTaskResult(task)) {
               committedSomething = true;
           }
           task.signalStop(); // Asigură oprirea
      });
      activeFloodsRef.current = []; // Golește array-ul

      // Actualizează textura O DATĂ dacă s-a făcut commit la ceva
      if (committedSomething && context && texture && sharedImageDataRef.current) {
            // console.log("Updating texture after commit before direct fill"); // Debug
            context.putImageData(sharedImageDataRef.current, 0, 0);
            texture.needsUpdate = true;
      }
      // --------------------------------------------------------------

      // Execută fill direct pe starea (posibil actualizată)
      performDirectFloodFill(sharedImageDataRef.current, context, texture, clickData.x_canvas, clickData.y_canvas, clickData.rgb);

  }, [context, texture, sharedImageDataRef, activeFloodsRef, commitTaskResult]);


  const handleAnimatedFillTrigger = useCallback((clickData) => {
    if (!sharedImageDataRef.current || !context || !texture) return null;
    const taskImageData = new ImageData( new Uint8ClampedArray(sharedImageDataRef.current.data), sharedImageDataRef.current.width, sharedImageDataRef.current.height );
    const task = new FloodTask(taskImageData, context, clickData.x_canvas, clickData.y_canvas, clickData.rgb, texture, 40, activeEffect);
    if (task.queue.length > 0) {
        addAnimatedTask(task);
        return task; // Returnează task-ul pentru usePaintInteraction
    }
    return null;
  }, [context, texture, sharedImageDataRef, activeEffect, addAnimatedTask]);


  // Hook Interacțiuni
  usePaintInteraction(
      isReady, gl, camera, meshRef, canvas,
      selectedFloodType, onColorShift,
      handleDirectFillTrigger, handleAnimatedFillTrigger
      // Nu mai pasăm elemente de commit aici
  );

  // --- Cleanup Principal la Schimbarea Modului sau Demontare ---
   useEffect(() => {
        // Se execută când se schimbă selectedFloodType sau la demontare
        return () => {
             // console.log(`PaintLayer Cleanup for type: ${selectedFloodType}`); // Debug
             let committedSomething = false;
             if (sharedImageDataRef.current) {
                 activeFloodsRef.current.forEach(task => {
                      if(commitTaskResult(task)) { // Comite task-urile rămase
                          committedSomething = true;
                      }
                      task.signalStop();
                 });
                 // Actualizează textura dacă s-a comit ceva
                 if (committedSomething && context && texture) {
                     context.putImageData(sharedImageDataRef.current, 0, 0);
                     texture.needsUpdate = true;
                 }
             }
             activeFloodsRef.current = []; // Golește array-ul
             // Ref-urile interne din usePaintInteraction (activeHoldTaskRef, stopTimerRef)
             // sunt curățate de cleanup-ul acelui hook.
        }
   // Adaugă commitTaskResult și referințele necesare
   }, [selectedFloodType, commitTaskResult, sharedImageDataRef, context, texture, activeFloodsRef]);


  // Actualizare geometrie (rămâne la fel)
  useEffect(() => {
      if (isReady && meshRef.current && size) {
          meshRef.current.geometry = new THREE.PlaneGeometry(size.width, size.height);
      }
  }, [isReady, size]);


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