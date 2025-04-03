// src/features/coloring/FloodTask.ts
import * as THREE from 'three'; // Import necesar pentru tipul Texture

// Presupunem că ai definit sau importat acest tip
type VisualEffect = 'none' | 'pulse' | 'ripple';

// Interfață pentru obiectele din coadă (opțional, dar bun pt claritate)
interface QueueItem {
    x: number;
    y: number;
    dist: number;
}

export class FloodTask {
    // --- Declarații explicite ale proprietăților clasei cu tipurile lor ---
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    batchSize: number;
    canvasWidth: number;
    canvasHeight: number;
    activeEffect: VisualEffect;
    fillColor: number[]; // Presupunem [R, G, B]
    imgData: ImageData;
    data: Uint8ClampedArray;
    shouldStop: boolean;
    _frameCount: number;
    visited: Set<number>; // Set de offset-uri numerice
    queue: QueueItem[];
    targetColor: number[] | Uint8ClampedArray; // Poate fi array sau subarray
    startX: number;
    startY: number;
    // -------------------------------------------------------------------

    constructor(
        imageData: ImageData,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        fillColor: number[], // Array [R, G, B]
        texture: THREE.CanvasTexture,
        batchSize: number = 40,
        activeEffect: VisualEffect = 'none'
    ) {
        // --- Asignări în constructor către proprietățile DEJA DECLARATE ---
        this.ctx = ctx;
        this.texture = texture;
        this.batchSize = batchSize;
        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;
        this.activeEffect = activeEffect;
        this.fillColor = fillColor;
        this.imgData = imageData; // Folosește copia ImageData primită
        this.data = this.imgData.data;
        this.shouldStop = false;
        this._frameCount = 0;
        this.visited = new Set();
        this.queue = [];
        this.targetColor = []; // Inițializare goală

        const startXInt = Math.floor(x);
        const startYInt = Math.floor(y);
        this.startX = startXInt;
        this.startY = startYInt;

        if (startXInt >= 0 && startXInt < this.canvasWidth && startYInt >= 0 && startYInt < this.canvasHeight) {
            const offset = (startYInt * this.canvasWidth + startXInt) * 4;
            if (this.data[offset + 3] >= 128) { // Verifică transparența la start
                this.targetColor = this.data.slice(offset, offset + 3); // Acum targetColor are tipul Uint8ClampedArray
                this.enqueue(startXInt, startYInt);
            } else {
                this.queue = [];
            }
        } else {
            this.queue = [];
        }
        // -----------------------------------------------------------------
    }

    signalStop(): void { // Adăugăm tipul de retur void
        this.shouldStop = true;
    }

    // Putem adăuga tipuri și la metode și parametri
    enqueue = (px: number, py: number): void => {
        const dx = px - this.startX; const dy = py - this.startY;
        const dist = Math.sqrt(dx * dx + dy * dy) + Math.random() * 5;
        this.queue.push({ x: px, y: py, dist });
    };

    matchColor(i: number): boolean { // Adăugăm tipul boolean
        if (this.data[i + 3] < 128) return false;
        const tolerance = 32;
        // Asigurăm că targetColor e tratat ca array de numere
        const targetR = this.targetColor[0] ?? 0;
        const targetG = this.targetColor[1] ?? 0;
        const targetB = this.targetColor[2] ?? 0;
        return (
            Math.abs(this.data[i] - targetR) <= tolerance &&
            Math.abs(this.data[i + 1] - targetG) <= tolerance &&
            Math.abs(this.data[i + 2] - targetB) <= tolerance
        );
    }

    setColor(i: number): void { // Adăugăm tipul void
        this.data[i] = this.fillColor[0]; this.data[i + 1] = this.fillColor[1];
        this.data[i + 2] = this.fillColor[2]; this.data[i + 3] = 255;
    }

    step(): boolean { // Adăugăm tipul boolean
        if (this.shouldStop || this.queue.length === 0) return false;

        this._frameCount++;
        let count = 0;
        this.queue.sort((a, b) => a.dist - b.dist);
        let pixelsChangedInBatch = false;

        while (this.queue.length > 0 && count < this.batchSize) {
            const { x: cx, y: cy } = this.queue.shift()!; // Folosim '!' pentru a indica că nu e null/undefined
            const i = (cy * this.canvasWidth + cx) * 4;
            if (cx < 0 || cx >= this.canvasWidth || cy < 0 || cy >= this.canvasHeight || !this.matchColor(i) || this.visited.has(i)) continue;

            this.setColor(i);
            this.visited.add(i);
            count++;
            pixelsChangedInBatch = true;

            // Aplică Efecte (logica rămâne la fel)
            if (this.activeEffect === 'pulse') {
                 const pulse = Math.floor(Math.sin(this._frameCount * 0.2) * 40);
                 this.data[i] = Math.min(255, Math.max(0, this.data[i] + pulse));
                 this.data[i + 1] = Math.min(255, Math.max(0, this.data[i + 1] - pulse));
                 this.data[i + 2] = Math.min(255, Math.max(0, this.data[i + 2] - pulse));
            } else if (this.activeEffect === 'ripple') {
                 const ripple = Math.floor(Math.sin((cx + cy) * 0.15 + this._frameCount * 0.5) * 50);
                 this.data[i + 2] = Math.min(255, Math.max(0, this.data[i + 2] + ripple));
            }

            this.enqueue(cx - 1, cy); this.enqueue(cx + 1, cy); this.enqueue(cx, cy - 1); this.enqueue(cx, cy + 1);
        }

        return this.queue.length > 0;
    }
}