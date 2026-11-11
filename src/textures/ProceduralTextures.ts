import * as THREE from 'three';

export class ProceduralTextures {
  private static instance: ProceduralTextures;

  public static getInstance(): ProceduralTextures {
    if (!ProceduralTextures.instance) {
      ProceduralTextures.instance = new ProceduralTextures();
    }
    return ProceduralTextures.instance;
  }

  // 1. Photorealistic Wet Asphalt with Reflective Puddles
  public createWetAsphaltTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark wet tarmac base
    ctx.fillStyle = '#0e1217';
    ctx.fillRect(0, 0, size, size);

    // Multi-frequency asphalt grain
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const fineNoise = (Math.random() - 0.5) * 36;
      data[i] = Math.min(255, Math.max(0, data[i] + fineNoise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + fineNoise + 1));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + fineNoise + 3));
    }
    ctx.putImageData(imgData, 0, 0);

    // Tarmac structural cracks and expansion joints
    ctx.strokeStyle = 'rgba(2, 4, 7, 0.75)';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      let x = Math.random() * size;
      let y = Math.random() * size;
      ctx.moveTo(x, y);
      for (let j = 0; j < 10; j++) {
        x += (Math.random() - 0.5) * 50;
        y += (Math.random() - 0.5) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Heavy puddle water accumulation (ultra-dark reflective pools)
    const puddleCenters = [
      { x: 300, y: 350, r: 160 },
      { x: 750, y: 220, r: 130 },
      { x: 500, y: 780, r: 210 },
      { x: 880, y: 680, r: 140 },
      { x: 180, y: 720, r: 110 },
    ];

    puddleCenters.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.1, p.x, p.y, p.r);
      grad.addColorStop(0, 'rgba(7, 11, 16, 0.36)');
      grad.addColorStop(0.65, 'rgba(9, 14, 20, 0.18)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // High-visibility Dock Safety Markings (Weathered Yellow & White)
    ctx.fillStyle = 'rgba(235, 180, 20, 0.85)';
    ctx.fillRect(size * 0.47, 0, 24, size);
    ctx.fillStyle = 'rgba(235, 180, 20, 0.85)';
    ctx.fillRect(size * 0.53, 0, 24, size);

    // Tire tread marks over road
    ctx.fillStyle = 'rgba(5, 8, 12, 0.35)';
    ctx.fillRect(size * 0.35, 0, 60, size);
    ctx.fillRect(size * 0.65, 0, 60, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  // Roughness Map (smooth sheen in puddles, rougher on aggregate)
  public createWetAsphaltRoughness(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base wet tarmac roughness
    ctx.fillStyle = '#686868';
    ctx.fillRect(0, 0, size, size);

    // Smooth puddles (soft wet reflection without harsh texel fireflies)
    const puddleCenters = [
      { x: 150, y: 175, r: 80 },
      { x: 375, y: 110, r: 65 },
      { x: 250, y: 390, r: 105 },
      { x: 440, y: 340, r: 70 },
      { x: 90, y: 360, r: 55 },
    ];

    puddleCenters.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r);
      grad.addColorStop(0, '#3a3a3a');
      grad.addColorStop(0.7, '#4c4c4c');
      grad.addColorStop(1, '#686868');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  // Asphalt Tangent-Space Normal Map (flat water on puddles, subtle grain on dry tarmac)
  public createAsphaltNormalMap(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const puddleCenters = [
      { x: 150, y: 175, r: 80 },
      { x: 375, y: 110, r: 65 },
      { x: 250, y: 390, r: 105 },
      { x: 440, y: 340, r: 70 },
      { x: 90, y: 360, r: 55 },
    ];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        let inPuddle = false;
        for (const p of puddleCenters) {
          if (Math.hypot(x - p.x, y - p.y) < p.r) {
            inPuddle = true;
            break;
          }
        }

        const noiseAmp = inPuddle ? 0.0 : 0.08;
        const nx = (Math.random() - 0.5) * noiseAmp;
        const ny = (Math.random() - 0.5) * noiseAmp;
        const nz = 1.0;
        const len = Math.hypot(nx, ny, nz);

        data[idx] = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  // 2. High-Fidelity Shipping Container Texture
  public createContainerTexture(colorHex: string, brand: string, serial: string): THREE.CanvasTexture {
    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base industrial coating
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, width, height);

    // Realistic Corrugation Ribs (Vertical Gradients)
    const ribWidth = 28;
    for (let x = 0; x < width; x += ribWidth) {
      const grad = ctx.createLinearGradient(x, 0, x + ribWidth, 0);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
      grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.30)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.65)');

      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, ribWidth, height);
    }

    // Industrial Weathering, Grime & Rust Run-offs
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * width;
      const rWidth = 4 + Math.random() * 20;
      const rHeight = 40 + Math.random() * 220;
      const rustGrad = ctx.createLinearGradient(rx, 0, rx, rHeight);
      rustGrad.addColorStop(0, 'rgba(85, 30, 10, 0.85)');
      rustGrad.addColorStop(0.6, 'rgba(125, 45, 15, 0.45)');
      rustGrad.addColorStop(1, 'rgba(85, 30, 10, 0)');

      ctx.fillStyle = rustGrad;
      ctx.fillRect(rx, 0, rWidth, rHeight);
    }

    // Prominent Shipping Line Brand Name Stencil
    ctx.save();
    ctx.font = '900 64px "Arial Black", sans-serif';
    ctx.fillStyle = 'rgba(245, 245, 245, 0.88)';
    ctx.letterSpacing = '6px';
    ctx.fillText(brand, 60, 280);

    // ISO Serial code & Technical Payload Specifications
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.fillText(serial, 60, 75);

    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = 'rgba(220, 220, 220, 0.75)';
    ctx.fillText('MAX GROSS: 32,500 KG / 71,650 LBS', 60, 110);
    ctx.fillText('TARE WT:   3,830 KG / 8,440 LBS', 60, 135);
    ctx.fillText('NET WT:    28,670 KG / 63,210 LBS', 60, 160);
    ctx.fillText('CUBE:      76.4 CU.M / 2,700 CU.FT', 60, 185);

    // Hazard Safety Stripes (Black & Yellow)
    const stripeW = 140;
    const stripeH = 70;
    const sx = width - 180;
    const sy = height - 110;
    ctx.fillStyle = '#ffbb00';
    ctx.fillRect(sx, sy, stripeW, stripeH);

    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 14;
    for (let s = -stripeH; s < stripeW + stripeH; s += 24) {
      ctx.beginPath();
      ctx.moveTo(sx + s, sy);
      ctx.lineTo(sx + s + 40, sy + stripeH);
      ctx.stroke();
    }
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  // Corrugated Container Normal Map
  public createContainerNormalMap(): THREE.CanvasTexture {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const ribWidth = 14;
    for (let x = 0; x < width; x++) {
      const phase = (x % ribWidth) / ribWidth;
      const nx = Math.sin(phase * Math.PI * 2) * 0.75;
      const ny = (Math.random() - 0.5) * 0.05;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);

      const r = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
      const g = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
      const b = Math.floor(((nz / len) * 0.5 + 0.5) * 255);

      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }

  // 3. Concrete Texture with Aggregate
  public createConcreteTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#454a50';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 45;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Hazard stripe on middle of barrier
    ctx.fillStyle = '#ffbb00';
    ctx.fillRect(0, size * 0.4, size, 50);

    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 18;
    for (let x = -50; x < size + 50; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, size * 0.4);
      ctx.lineTo(x + 50, size * 0.4 + 50);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 4. Anodized Gunmetal PBR Weapon Texture
  public createGunMetalTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Matte dark charcoal finish
    ctx.fillStyle = '#22262a';
    ctx.fillRect(0, 0, size, size);

    // Fine brushed metal streaks
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain + 1));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain + 2));
    }
    ctx.putImageData(imgData, 0, 0);

    // Edge wear highlights (silver scuffs)
    ctx.strokeStyle = 'rgba(210, 225, 240, 0.25)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 5. Polymer Stipple Texture (Pistol Grip & Stock)
  public createPolymerTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#16181b';
    ctx.fillRect(0, 0, size, size);

    // High frequency stippling dots
    ctx.fillStyle = '#282c32';
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 6. Holographic Sight Reticle (Glowing Cyan / Red Optical Glass)
  public createHoloReticleTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Center glow circle
    const center = size / 2;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(center, center, 48, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Cross ticks
    ctx.lineWidth = 3;
    const tickLen = 14;
    // Top
    ctx.beginPath(); ctx.moveTo(center, center - 62); ctx.lineTo(center, center - 62 - tickLen); ctx.stroke();
    // Bottom
    ctx.beginPath(); ctx.moveTo(center, center + 62); ctx.lineTo(center, center + 62 + tickLen); ctx.stroke();
    // Left
    ctx.beginPath(); ctx.moveTo(center - 62, center); ctx.lineTo(center - 62 - tickLen, center); ctx.stroke();
    // Right
    ctx.beginPath(); ctx.moveTo(center + 62, center); ctx.lineTo(center + 62 + tickLen, center); ctx.stroke();

    // Center 1 MOA dot
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 7. Ground Puddle Ripple Ring Texture
  public createRippleTexture(): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    const grad = ctx.createRadialGradient(64, 64, 48, 64, 64, 60);
    grad.addColorStop(0, 'rgba(150, 195, 230, 0)');
    grad.addColorStop(0.6, 'rgba(165, 205, 240, 0.22)');
    grad.addColorStop(1, 'rgba(150, 195, 230, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 8. Muzzle Flash Texture
  public createMuzzleFlashTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.18, 'rgba(255, 230, 110, 0.95)');
    grad.addColorStop(0.45, 'rgba(255, 120, 25, 0.55)');
    grad.addColorStop(1, 'rgba(255, 30, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }
}
