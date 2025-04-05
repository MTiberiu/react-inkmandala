// src/hooks/usePaintInteraction.js
import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '../stores/appStore';
import { Raycaster, Vector2 } from 'three';
// Importă noua funcție de desenare
import { performDrawStroke } from '../features/coloring/drawUtils'; // Ajustează calea dacă e nevoie
import { hexToRgb } from '../utils/colorUtils';
export default function usePaintInteraction(
  isReady, gl, camera, meshRef, canvas,
  selectedPaintMode, // Prop actualizat
  onColorShift, // Folosit eventual pentru particule
  onDirectFillTrigger, // Handler pentru modul DIRECT
  onAnimatedFillTrigger, // Handler pentru modurile ANIMATED/HOLD
  // --- Dependințe noi necesare pentru DRAW ---
  sharedImageDataRef, // Ref la ImageData partajat
  texture,            // Textura de actualizat
  context
  // ------------------------------------------
) {
  const activeHoldTaskRef = useRef(null);
  const stopTimerRef = useRef(null);
  const isDrawingRef = useRef(false); // Stare pentru a urmări dacă desenăm
  const selectedColor = useAppStore((state) => state.selectedColor);
  // Funcția de Raycasting (rămâne la fel)
  const handleRaycast = useCallback((event) => {
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
    // -- Eliminăm selectarea și conversia culorii de aici --
    // const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    // const rgb = hexToRgb(color);
    // ++ Returnăm doar datele geometrice ++
    return { x_canvas, y_canvas, intersectionPoint };
  }, [gl, camera, meshRef, canvas]);
  useEffect(() => {
    console.log('usePaintInteraction Effect: Running. Mode:', selectedPaintMode, 'isReady:', isReady); // <-- LOG ADAUGAT
    // Verificări inițiale (adăugat sharedImageDataRef și texture)
    if (!isReady || !gl || !canvas || !sharedImageDataRef?.current || !texture || !context) {
      console.log('usePaintInteraction Effect: Aborting (not ready or refs missing)');  
      // Resetăm starea de desenare la cleanup sau dacă nu suntem gata
        isDrawingRef.current = false;
        return;
    }
    const domElement = gl.domElement;

    // --- Handlers pentru modul DRAW ---
    const handleDrawPointerDown = (event) => {
      // Verifică dacă e click stânga
      if (event.button !== 0) return;
      console.log('DRAW: handleDrawPointerDown');
      event.preventDefault(); // Previne selectarea textului etc.
      isDrawingRef.current = true; // Începe desenarea
      console.log('DRAW: isDrawingRef set to ->', isDrawingRef.current); 
      // Desenează primul punct imediat
      handleDrawPointerMove(event);
    };

    const handleDrawPointerMove = (event) => {
      if (!isDrawingRef.current) return;
      event.preventDefault();
      const strokeData = handleRaycast(event);
      // ++ Verifică strokeData și convertește selectedColor aici ++
      if (strokeData && sharedImageDataRef.current && context && texture) {
        const brushSize = 15;
        const rgbColor = hexToRgb(selectedColor); // Conversia culorii selectate
        performDrawStroke(
           sharedImageDataRef.current,
           context,
           texture,
           strokeData.x_canvas,
           strokeData.y_canvas,
           brushSize,
           rgbColor // Folosește culoarea convertită
        );
        // if(onColorShift) onColorShift(strokeData.intersectionPoint.x, strokeData.intersectionPoint.y, rgbColor); // Poți pasa rgbColor dacă e nevoie
      }
    };

    const handleDrawPointerUpOrLeave = (event) => {
       // Oprește desenarea la ridicarea butonului (doar stânga) sau la părăsirea canvas-ului
       if ((event.type === 'pointerup' && event.button === 0) || event.type === 'pointerleave') {
        console.log(`DRAW: handleDrawPointerUpOrLeave (type: ${event.type})`);  
        isDrawingRef.current = false;
       }
    };
    // --- Sfârșit Handlers DRAW ---

    // --- Handlers existenți (Direct, Animated, Hold) ---
    const handleDirectClick = (event) => {
      if (event.button !== 0) return;
      const clickData = handleRaycast(event);
      // ++ Verifică clickData și convertește selectedColor aici ++
      if (clickData) {
        const rgbColor = hexToRgb(selectedColor); // Conversia culorii selectate
        if(onColorShift) onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, rgbColor);
        // Pasează datele geometrice și culoarea convertită către trigger
        onDirectFillTrigger({ ...clickData, rgb: rgbColor });
      }
    };
    const handleAnimatedPointerDown = (event) => {
      if (event.button !== 0) return;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
      activeHoldTaskRef.current = null; // Resetăm task-ul hold
      const clickData = handleRaycast(event);
       // ++ Verifică clickData și convertește selectedColor aici ++
      if (clickData) {
        const rgbColor = hexToRgb(selectedColor); // Conversia culorii selectate
        if(onColorShift) onColorShift(clickData.intersectionPoint.x, clickData.intersectionPoint.y, rgbColor);
         // Pasează datele geometrice și culoarea convertită către trigger
        const newTask = onAnimatedFillTrigger({ ...clickData, rgb: rgbColor });
        if (selectedPaintMode === 'HOLD_AND_RELEASE' && newTask) {
          activeHoldTaskRef.current = newTask;
        }
      }
    };

     const handleHoldPointerUpLeave = () => {
        if (activeHoldTaskRef.current && !stopTimerRef.current) {
            const taskToStop = activeHoldTaskRef.current;
            const delaySeconds = 0.5;
            stopTimerRef.current = setTimeout(() => {
                if (taskToStop) taskToStop.signalStop();
                stopTimerRef.current = null;
                if (activeHoldTaskRef.current === taskToStop) {
                   activeHoldTaskRef.current = null;
                }
           }, delaySeconds * 1000);
        }
     };
    // --- Sfârșit Handlers existenți ---

    // --- Atașare / Dezatașare Listeners ---
    // Resetăm toți listenerii posibili la început
    domElement.removeEventListener('click', handleDirectClick);
    domElement.removeEventListener('pointerdown', handleAnimatedPointerDown);
    domElement.removeEventListener('pointerdown', handleDrawPointerDown);
    domElement.removeEventListener('pointermove', handleDrawPointerMove);
    window.removeEventListener('pointerup', handleHoldPointerUpLeave);
    window.removeEventListener('pointerup', handleDrawPointerUpOrLeave);
    window.removeEventListener('pointerleave', handleHoldPointerUpLeave); // Folosit de HOLD
    domElement.removeEventListener('pointerleave', handleDrawPointerUpOrLeave); // Folosit de DRAW

    // Atașăm listenerii corecți în funcție de mod
    if (selectedPaintMode === 'DIRECT') {
      domElement.addEventListener('click', handleDirectClick);
    } else if (selectedPaintMode === 'ANIMATED') {
      domElement.addEventListener('pointerdown', handleAnimatedPointerDown);
    } else if (selectedPaintMode === 'HOLD_AND_RELEASE') {
      domElement.addEventListener('pointerdown', handleAnimatedPointerDown);
      window.addEventListener('pointerup', handleHoldPointerUpLeave);
      window.addEventListener('pointerleave', handleHoldPointerUpLeave);
    } else if (selectedPaintMode === 'DRAW') {
      console.log('usePaintInteraction Effect: Attaching DRAW listeners');
       domElement.addEventListener('pointerdown', handleDrawPointerDown);
       domElement.addEventListener('pointermove', handleDrawPointerMove);
       // Ascultăm 'up' pe window pentru a prinde eventul chiar dacă mouse-ul iese din canvas
       window.addEventListener('pointerup', handleDrawPointerUpOrLeave);
       // Ascultăm 'leave' pe elementul canvas
       domElement.addEventListener('pointerleave', handleDrawPointerUpOrLeave);
    } else {
      console.log('usePaintInteraction Effect: Attaching listeners for mode:', selectedPaintMode); 
    }

    // --- Cleanup ---
    return () => {
      // Dezatașăm toți listenerii posibili la cleanup
      domElement.removeEventListener('click', handleDirectClick);
      domElement.removeEventListener('pointerdown', handleAnimatedPointerDown);
      domElement.removeEventListener('pointerdown', handleDrawPointerDown);
      domElement.removeEventListener('pointermove', handleDrawPointerMove);
      window.removeEventListener('pointerup', handleHoldPointerUpLeave);
      window.removeEventListener('pointerup', handleDrawPointerUpOrLeave);
      window.removeEventListener('pointerleave', handleHoldPointerUpLeave);
      domElement.removeEventListener('pointerleave', handleDrawPointerUpOrLeave);

      // Curățăm și stările interne
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
      activeHoldTaskRef.current = null;
      isDrawingRef.current = false; // Oprește desenarea la schimbarea modului/demontare
    };
  }, [ // Lista de dependențe actualizată
    isReady, gl, camera, meshRef, canvas, selectedPaintMode,
         onColorShift, onDirectFillTrigger, onAnimatedFillTrigger,
         handleRaycast, sharedImageDataRef, texture, context,
         selectedColor // Adăugat sharedImageDataRef, texture
  ]); // Asigură-te că ai toate dependențele corecte
} // Sfârșitul hook-ului usePaintInteraction