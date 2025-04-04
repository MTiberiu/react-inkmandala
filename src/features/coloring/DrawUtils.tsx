// src/features/coloring/floodFillUtils.js

/**
 * Realizează umplerea sincronă (directă) a unei zone.
 * Modifică obiectul imageData primit.
 * @param {ImageData} imageData - Obiectul ImageData care va fi modificat.
 * @param {CanvasRenderingContext2D} ctx - Contextul 2D (necesar pentru width/height).
 * @param {THREE.CanvasTexture} texture - Textura Three.js (pentru needsUpdate).
 * @param {number} startX - Coordonata X de start.
 * @param {number} startY - Coordonata Y de start.
 * @param {Array<number>} fillColorRgb - Culoarea [R, G, B].
 * @param {number} tolerance - Toleranța pentru potrivirea culorilor.
 */
export function performDirectFloodFill(imageData, ctx, texture, startX, startY, fillColorRgb, tolerance = 20) {
  if (!imageData) { console.error("performDirectFloodFill: imageData is missing!"); return; }
  const canvasWidth = imageData.width;
  const canvasHeight = imageData.height;
  const data = imageData.data;
  const visited = new Set();
  const queue = [];
  const startNodeX = Math.floor(startX);
  const startNodeY = Math.floor(startY);

  if (startNodeX < 0 || startNodeX >= canvasWidth || startNodeY < 0 || startNodeY >= canvasHeight) return;

  const startOffset = (startNodeY * canvasWidth + startNodeX) * 4;
  if (data[startOffset + 3] < 128) return; // Ignoră start transparent

  const targetColor = data.slice(startOffset, startOffset + 3);

  function matchColor(offset) {
      if (data[offset + 3] < 128) return false;
      return (
          Math.abs(data[offset] - targetColor[0]) <= tolerance &&
          Math.abs(data[offset + 1] - targetColor[1]) <= tolerance &&
          Math.abs(data[offset + 2] - targetColor[2]) <= tolerance
      );
  }

  function setColor(offset) {
      data[offset] = fillColorRgb[0]; data[offset + 1] = fillColorRgb[1];
      data[offset + 2] = fillColorRgb[2]; data[offset + 3] = 255;
  }

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

  // Actualizează contextul și textura O SINGURĂ DATĂ
  ctx.putImageData(imageData, 0, 0);
  texture.needsUpdate = true;
}


/**
* Combină modificările dintr-un ImageData (overlay) peste un ImageData de bază,
* folosind un Set de pixeli vizitați (offsets).
* Modifică obiectul baseImageData in-place.
* @param {ImageData} baseImageData - Starea principală care va fi modificată.
* @param {ImageData} overlayImageData - Starea task-ului care conține modificările.
* @param {Set<number>} visitedPixels - Set ce conține offset-urile pixelilor modificați de task.
*/
export function mergeImageData(baseImageData, overlayImageData, visitedPixels) {
  if (!baseImageData || !overlayImageData || !visitedPixels || visitedPixels.size === 0) return;
  const baseData = baseImageData.data;
  const overlayData = overlayImageData.data;

  for (const pixelIndex of visitedPixels) {
      // Verificare limite (extra siguranță)
      if (pixelIndex + 3 < baseData.length && pixelIndex + 3 < overlayData.length) {
          baseData[pixelIndex] = overlayData[pixelIndex];         // R
          baseData[pixelIndex + 1] = overlayData[pixelIndex + 1]; // G
          baseData[pixelIndex + 2] = overlayData[pixelIndex + 2]; // B
          baseData[pixelIndex + 3] = overlayData[pixelIndex + 3]; // A
      }
  }
}

export function performDrawStroke(
  imageData: ImageData | null,
  ctx: CanvasRenderingContext2D | null,
  texture: THREE.CanvasTexture,
  x: number,
  y: number,
  brushSize: number,
  colorRgb: number[]
) {
  if (!imageData || !ctx) {
    console.error("performDrawStroke: imageData or context is missing!");
    return;
  }
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  const radius = Math.max(1, Math.floor(brushSize / 2));
  const startX = Math.floor(x - radius);
  const startY = Math.floor(y - radius);
  const endX = Math.floor(x + radius);
  const endY = Math.floor(y + radius);

  let changed = false;

  // --- MODIFICARE ---
  // Setează un prag pentru cât de închisă trebuie să fie o culoare pentru a fi considerată "linie neagră"
  // O valoare mai mică este mai strictă (mai aproape de negru pur).
  // O valoare ca 50 va include și griuri foarte închise. Ajustează după nevoie.
  const blackThreshold = 150;
  // -------------

  for (let cy = startY; cy <= endY; cy++) {
    for (let cx = startX; cx <= endX; cx++) {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        const dx = cx - x;
        const dy = cy - y;
        // Verifică dacă pixelul este în raza pensulei
        if (dx * dx + dy * dy <= radius * radius) {
          const offset = (cy * width + cx) * 4;

          // --- MODIFICARE ---
          // Verifică culoarea pixelului destinație ȘI canalul alpha
          const isOpaque = data[offset + 3] > 128; // Verificăm dacă pixelul este suficient de opac
          const isDark = data[offset] < blackThreshold &&
                         data[offset + 1] < blackThreshold &&
                         data[offset + 2] < blackThreshold;

          // Colorează DOAR dacă pixelul este opac ȘI NU este considerat "negru/închis"
          if (isOpaque && !isDark) {
          // -------------
            // Aplică culoarea nouă
            data[offset]     = colorRgb[0];
            data[offset + 1] = colorRgb[1];
            data[offset + 2] = colorRgb[2];
            data[offset + 3] = 255; // Asigură opacitatea completă a culorii aplicate
            changed = true;
          }
        }
      }
    }
  }

  if (changed) {
    // Actualizează contextul canvas-ului 2D (esențial!)
    ctx.putImageData(imageData, 0, 0); // [Source 328]
    // Marchează textura Three.js pentru actualizare pe GPU
    texture.needsUpdate = true; // [Source 329]
  }
}