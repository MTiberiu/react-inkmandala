// src/hooks/usePaintInteraction.js
import { useEffect, useRef, useCallback } from 'react';
// ... (alte importuri: Raycaster, Vector2, utils...)
import { hexToRgb, COLORS } from '../utils/colorUtils';
import { Raycaster, Vector2 } from 'three';
// NU mai importăm mergeImageData aici

export default function usePaintInteraction(
  isReady,
  gl,
  camera,
  meshRef,
  canvas,
  selectedFloodType,
  onColorShift,
  onDirectFillTrigger,
  onAnimatedFillTrigger // onAnimatedFillTrigger returnează task-ul
  // NU mai primim elementele pentru commit aici
) {
  const activeHoldTaskRef = useRef(null); // Ref INTERN pentru task-ul HOLD
  const stopTimerRef = useRef(null);

  // Raycasting (rămâne la fel)
  const handleRaycast = useCallback(
    event => {
      /* ... implementare existentă ... */
      if (!meshRef.current || !gl || !camera || !canvas) return null;
      const domElement = gl.domElement;
      const bounds = domElement.getBoundingClientRect();
      const ndc = new Vector2(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
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
    },
    [gl, camera, meshRef, canvas, hexToRgb]
  );

  // Efectul pentru evenimente
  useEffect(() => {
    if (!isReady || !gl || !canvas) return;
    const domElement = gl.domElement;

    // Handler Direct (rămâne la fel)
    const handleDirectClick = event => {
      if (event.button !== 0) {
        // console.log("Ignored non-left click for DIRECT:", event.button); // Debug
        return;
      }
      const clickData = handleRaycast(event);
      if (clickData) {
        onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, clickData.rgb);
        onDirectFillTrigger(clickData);
      }
    };

    // Handler Animated/Hold Start (modificat)
    const handleAnimatedPointerDown = event => {
      if (event.button !== 0) {
        // console.log("Ignored non-left pointerdown:", event.button); // Debug
        return;
      }
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
      // NU mai comitem task-ul anterior HOLD de aici
      activeHoldTaskRef.current = null; // Doar resetăm ref-ul intern

      const clickData = handleRaycast(event);
      if (clickData) {
        onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, clickData.rgb);
        const newTask = onAnimatedFillTrigger(clickData); // Apelează callback-ul care creează task-ul

        // Salvează referința returnată *doar* dacă e modul HOLD
        if (selectedFloodType === 'HOLD_AND_RELEASE' && newTask) {
          activeHoldTaskRef.current = newTask;
        }
      }
    };

    // Handler Hold End (modificat - doar semnalează oprire)
    const handleHoldPointerUpLeave = () => {
      if (activeHoldTaskRef.current && !stopTimerRef.current) {
        const taskToStop = activeHoldTaskRef.current;
        const delaySeconds = 0.5;
        // console.log(`Interaction: Starting ${delaySeconds}s stop timer for task.`); // Debug
        stopTimerRef.current = setTimeout(() => {
          // console.log('Interaction: Stop timer expired. Signaling stop.'); // Debug
          if (taskToStop) {
            taskToStop.signalStop(); // Doar semnalează oprire
            // Bucla de animație va vedea task-ul ca terminat și va apela commitTaskResult
          }
          stopTimerRef.current = null;
          // Resetăm ref-ul intern DUPĂ ce timer-ul a expirat și a semnalat
          if (activeHoldTaskRef.current === taskToStop) {
            activeHoldTaskRef.current = null;
          }
        }, delaySeconds * 1000);
      }
    };

    // --- Atașare Listeneri --- (la fel ca înainte)
    let clickHandler = null,
      pointerDownHandler = null,
      pointerUpHandler = null,
      pointerLeaveHandler = null;
    if (selectedFloodType === 'DIRECT') {
      clickHandler = handleDirectClick;
      domElement.addEventListener('click', clickHandler);
    } else if (selectedFloodType === 'ANIMATED') {
      pointerDownHandler = handleAnimatedPointerDown;
      domElement.addEventListener('pointerdown', pointerDownHandler);
    } else if (selectedFloodType === 'HOLD_AND_RELEASE') {
      pointerDownHandler = handleAnimatedPointerDown;
      pointerUpHandler = handleHoldPointerUpLeave;
      pointerLeaveHandler = handleHoldPointerUpLeave;
      domElement.addEventListener('pointerdown', pointerDownHandler);
      window.addEventListener('pointerup', pointerUpHandler);
      window.addEventListener('pointerleave', pointerLeaveHandler);
    }

    // --- Cleanup --- (modificat - nu mai comite, doar oprește timer)
    return () => {
      if (clickHandler) domElement.removeEventListener('click', clickHandler);
      if (pointerDownHandler) domElement.removeEventListener('pointerdown', pointerDownHandler);
      if (pointerUpHandler) window.removeEventListener('pointerup', pointerUpHandler);
      if (pointerLeaveHandler) window.removeEventListener('pointerleave', pointerLeaveHandler);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
      // Task-ul activ HOLD va fi oprit și comit de cleanup-ul principal din PaintLayer
      activeHoldTaskRef.current = null; // Doar curățăm ref-ul intern
    };
  }, [
    isReady,
    gl,
    camera,
    meshRef,
    canvas,
    selectedFloodType,
    onColorShift,
    onDirectFillTrigger,
    onAnimatedFillTrigger,
    handleRaycast // Eliminăm commitTaskResult de aici
  ]);
}
