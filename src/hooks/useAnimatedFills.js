// src/hooks/useAnimatedFills.js
import { useRef, useEffect, useCallback } from 'react';
import useAppStore from '../stores/appStore';


export default function useAnimatedFills(
    isReady,
    selectedFloodType,
    context,
    texture,
    sharedImageDataRef,
    // +++ Primim funcția de commit ca prop +++
    commitTaskResult
) {
    const activeFloodsRef = useRef([]);
    const animationFrameIdRef = useRef(null);
    const clearTrigger = useAppStore(state => state.clearTrigger); 

    const addAnimatedTask = useCallback((task) => {
        if (task && task.queue && task.queue.length > 0) {
            activeFloodsRef.current.push(task);
        } else {
            console.warn("Attempted to add an invalid or empty task.");
        }
    }, []);

    useEffect(() => {
        const shouldRunLoop = isReady && (selectedFloodType === 'ANIMATED' || selectedFloodType === 'HOLD_AND_RELEASE');
        if (!shouldRunLoop) {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
            return;
        }

        const loop = () => {
            if (!sharedImageDataRef.current || !context || !texture) {
                animationFrameIdRef.current = requestAnimationFrame(loop); return;
            }

            const baseImageData = sharedImageDataRef.current;
            let frameImageData = null;
            let textureNeedsUpdateThisFrame = false;
            let commitNeeded = false; // Flag dacă trebuie să actualizăm textura după commit

            if (activeFloodsRef.current.length > 0) {
                frameImageData = new ImageData( new Uint8ClampedArray(baseImageData.data), baseImageData.width, baseImageData.height );
            }

            const stillActiveTasks = [];
            for (const task of activeFloodsRef.current) {
                const shouldContinue = task.step();

                if (task.visited.size > 0 && frameImageData) {
                    const taskData = task.imgData.data; const frameData = frameImageData.data;
                    for (const pixelIndex of task.visited) {
                        if(pixelIndex+3 < frameData.length && pixelIndex+3 < taskData.length) {
                           frameData[pixelIndex]     = taskData[pixelIndex]; frameData[pixelIndex + 1] = taskData[pixelIndex + 1];
                           frameData[pixelIndex + 2] = taskData[pixelIndex + 2]; frameData[pixelIndex + 3] = taskData[pixelIndex + 3];
                        }
                    }
                    textureNeedsUpdateThisFrame = true;
                }

                if (shouldContinue) {
                    stillActiveTasks.push(task);
                } else {
                    // --- TASK TERMINAT (natural sau prin signalStop) ---
                    // Comite rezultatul său în starea master
                    commitTaskResult(task); // <--- Apelăm funcția de commit
                    commitNeeded = true; // Marcam ca am facut commit, s-ar putea sa necesite update textura
                }
            }
            activeFloodsRef.current = stillActiveTasks;

            // Actualizează textura vizibilă
            if (textureNeedsUpdateThisFrame && frameImageData) {
                context.putImageData(frameImageData, 0, 0);
                texture.needsUpdate = true;
            } else if (commitNeeded && !textureNeedsUpdateThisFrame) {
                 // Daca nu am actualizat textura cu frameImageData dar am facut commit,
                 // actualizam textura cu starea shared actualizata
                 context.putImageData(sharedImageDataRef.current, 0, 0);
                 texture.needsUpdate = true;
            }


            animationFrameIdRef.current = requestAnimationFrame(loop);
        };

        if (!animationFrameIdRef.current) {
            animationFrameIdRef.current = requestAnimationFrame(loop);
        }

        return () => {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
            // NU mai comitem task-urile aici la cleanup-ul buclei,
            // se va face în cleanup-ul principal din PaintLayer sau înainte de Direct Fill
        };
    // Adaugă commitTaskResult ca dependență
    }, [isReady, selectedFloodType, context, texture, sharedImageDataRef, commitTaskResult]);


    +   // --- Efect pentru a curăța task-urile la clear ---
   useEffect(() => {
       if (clearTrigger === null) return; // Ignoră starea inițială

       console.log("Hook: Clearing Active Animated Tasks Triggered"); // Debug
       // Oprește task-urile (semnalul e suficient, bucla nu le va mai procesa)
       activeFloodsRef.current.forEach(task => task.signalStop());
       // Golește array-ul
       activeFloodsRef.current = [];

   }, [clearTrigger]); // Rulează DOAR când se schimbă trigger-ul
    return { addAnimatedTask, activeFloodsRef }; // Expunem ref-ul pentru a putea fi golit extern
}