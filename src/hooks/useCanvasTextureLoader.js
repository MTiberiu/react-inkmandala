// src/hooks/useCanvasTextureLoader.js
import { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import useAppStore from '../stores/appStore';

export default function useCanvasTextureLoader(imageUrl) {
  const [isReady, setIsReady] = useState(false);
  const [size, setSize] = useState({ width: 10, height: 10 });
  const sharedImageDataRef = useRef(null);
  const originalImageDataRef = useRef(null);
  const clearTrigger = useAppStore(state => state.clearTrigger);

  const { canvas, context, texture } = useMemo(() => {
    const cvs = document.createElement('canvas');
    cvs.width = 1; cvs.height = 1;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return { canvas: cvs, context: ctx, texture: tex };
  }, []);

  // Efect pentru încărcarea imaginii
  useEffect(() => {
    setIsReady(false);
    sharedImageDataRef.current = null;
    originalImageDataRef.current = null;
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (!isMounted || !canvas || !context || !texture) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const targetWidth = 10;
      const aspect = img.naturalHeight / img.naturalWidth;
      setSize({ width: targetWidth, height: targetWidth * aspect });
      context.drawImage(img, 0, 0);
      try { context.getImageData(0, 0, 1, 1); } catch (e) { console.warn('getImageData warmup failed', e); }

      // --- Corecția este Aici ---
      // 1. Obține datele imaginii o singură dată
      const loadedImageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // 2. Setează starea partajată (care va fi modificată de colorare)
      sharedImageDataRef.current = loadedImageData;

      // 3. Salvează o COPIE separată a datelor originale
      originalImageDataRef.current = new ImageData(
          new Uint8ClampedArray(loadedImageData.data), // Folosește datele din variabila corectă
          loadedImageData.width,
          loadedImageData.height
      );
      // --- Sfârșit Corecție ---

      texture.needsUpdate = true;
      setIsReady(true);
    };
    img.onerror = () => { if (isMounted) console.error("Failed image load:", imageUrl); };
    return () => { isMounted = false; };
  }, [imageUrl, canvas, context, texture]);

  // --- Efect pentru a gestiona resetarea --- (rămâne la fel)
   useEffect(() => {
       if (clearTrigger === null || !originalImageDataRef.current || !sharedImageDataRef.current || !context || !texture || !isReady) {
            return;
       }
       // console.log("Hook: Canvas Reset Triggered");
       const originalDataCopy = new ImageData(new Uint8ClampedArray(originalImageDataRef.current.data), originalImageDataRef.current.width, originalImageDataRef.current.height);
       sharedImageDataRef.current = originalDataCopy;
       context.putImageData(sharedImageDataRef.current, 0, 0);
       texture.needsUpdate = true;
   }, [clearTrigger, context, texture, isReady]); // Am scos sharedImageDataRef din dependențe


  return { canvas, context, texture, size, isReady, sharedImageDataRef };
}