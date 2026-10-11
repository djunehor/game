import * as THREE from 'three';

// Procedural PBR Canvas Texture Generator for Biggie House
// Generates high-resolution, zero-latency procedural PBR textures directly in memory.

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(key: string, drawFn: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    // SSR / Node testing fallback
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }

  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}

// 1. Luxury Herringbone / Parquet Oak Hardwood Floor
export function getParquetTexture(repeatX = 4, repeatZ = 4): THREE.CanvasTexture {
  const tex = getOrCreateTexture('parquet_wood', (ctx, size) => {
    // Warm base oak
    ctx.fillStyle = '#b88652';
    ctx.fillRect(0, 0, size, size);

    const plankW = size / 8;
    const plankH = size / 2;

    for (let x = 0; x < size; x += plankW) {
      for (let y = 0; y < size; y += plankH) {
        const offset = ((x / plankW) % 2) * (plankH / 2);
        const actualY = (y + offset) % size;

        // Subtle plank color variance
        const toneShift = (Math.sin(x * 12.3 + y * 4.7) * 0.5 + 0.5) * 24 - 12;
        ctx.fillStyle = `rgb(${184 + toneShift}, ${134 + toneShift * 0.8}, ${82 + toneShift * 0.6})`;
        ctx.fillRect(x + 1, actualY + 1, plankW - 2, plankH - 2);

        // Wood grain streaks
        ctx.strokeStyle = 'rgba(70, 40, 15, 0.12)';
        ctx.lineWidth = 1;
        for (let g = 0; g < 4; g++) {
          const gx = x + 3 + g * (plankW / 4);
          ctx.beginPath();
          ctx.moveTo(gx, actualY);
          ctx.lineTo(gx + (Math.sin(g) * 3), actualY + plankH);
          ctx.stroke();
        }

        // Plank bevel edge shadow
        ctx.strokeStyle = 'rgba(40, 20, 5, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, actualY, plankW, plankH);
      }
    }
  }, 512);

  tex.repeat.set(repeatX, repeatZ);
  tex.needsUpdate = true;
  return tex;
}

// 2. Italian Calacatta Polished Marble Tiles (Kitchen & Bathrooms)
export function getMarbleTexture(repeatX = 3, repeatZ = 3): THREE.CanvasTexture {
  const tex = getOrCreateTexture('marble_calacatta', (ctx, size) => {
    // Pure marble cream/white base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    // Grout grid (4x4 large slabs)
    const slabSize = size / 4;

    // Organic Veining
    for (let v = 0; v < 7; v++) {
      ctx.strokeStyle = v % 2 === 0 ? 'rgba(148, 163, 184, 0.35)' : 'rgba(180, 150, 100, 0.22)';
      ctx.lineWidth = 2 + (v % 3);
      ctx.beginPath();
      let vx = (v * 73) % size;
      let vy = 0;
      ctx.moveTo(vx, vy);
      while (vy < size) {
        vx += (Math.sin(vy * 0.05 + v) * 8) + (Math.random() * 4 - 2);
        vy += 8;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Tile Grout lines
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += slabSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
  }, 512);

  tex.repeat.set(repeatX, repeatZ);
  tex.needsUpdate = true;
  return tex;
}

// 3. Mediterranean Azure Glass Mosaic Pool Tiles
export function getPoolMosaicTexture(repeatX = 6, repeatZ = 6): THREE.CanvasTexture {
  const tex = getOrCreateTexture('pool_mosaic', (ctx, size) => {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, size, size);

    const tileSize = size / 16;
    const colors = ['#0284c7', '#0ea5e9', '#38bdf8', '#0369a1', '#075985', '#22d3ee'];

    for (let x = 0; x < size; x += tileSize) {
      for (let y = 0; y < size; y += tileSize) {
        const c = colors[Math.floor((Math.sin(x * 3.7 + y * 5.1) * 0.5 + 0.5) * colors.length)];
        ctx.fillStyle = c;
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Highlight glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(x + 1, y + 1, (tileSize - 2) * 0.4, 2);
      }
    }

    // Grout lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  }, 512);

  tex.repeat.set(repeatX, repeatZ);
  tex.needsUpdate = true;
  return tex;
}

// 4. Acoustic Wood Slat Media Wall Paneling (Lounge & Diary Room)
export function getAcousticSlatTexture(repeatX = 2, repeatZ = 1): THREE.CanvasTexture {
  const tex = getOrCreateTexture('acoustic_slats', (ctx, size) => {
    // Dark felt acoustic background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const slatW = size / 24;
    const gap = slatW * 0.35;

    for (let x = 0; x < size; x += slatW + gap) {
      // Warm dark walnut slat
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(x, 0, slatW, size);

      // Slat edge highlight
      ctx.fillStyle = '#7a4e2c';
      ctx.fillRect(x, 0, 2, size);

      // Slat shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x + slatW - 2, 0, 2, size);
    }
  }, 512);

  tex.repeat.set(repeatX, repeatZ);
  tex.needsUpdate = true;
  return tex;
}

// 5. Luxury Velvet / Geometric African Area Rug Pattern
export function getLuxuryRugTexture(primary = '#991b1b', accent = '#d97706'): THREE.CanvasTexture {
  const key = `luxury_rug_${primary}_${accent}`;
  const tex = getOrCreateTexture(key, (ctx, size) => {
    // Base velvet tone
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, size, size);

    // Ornate gold/bronze border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, size - 32, size - 32);

    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, size - 72, size - 72);

    // Center diamond motif
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(size / 2, 80);
    ctx.lineTo(size - 80, size / 2);
    ctx.lineTo(size / 2, size - 80);
    ctx.lineTo(80, size / 2);
    ctx.closePath();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Subtle fabric fiber noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
  }, 512);

  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

// 6. Architectural Interior Plaster Wall Texture
export function getPlasterTexture(repeatX = 4, repeatZ = 2): THREE.CanvasTexture {
  const tex = getOrCreateTexture('plaster_wall', (ctx, size) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);

    // Subtle stippling texture
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = Math.random() * 0.06;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(148,163,184,${alpha})`;
      ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
  }, 256);

  tex.repeat.set(repeatX, repeatZ);
  tex.needsUpdate = true;
  return tex;
}
