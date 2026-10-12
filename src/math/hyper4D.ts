export type Vector4D = [number, number, number, number]; // [x, y, z, w]
export type Vector3D = [number, number, number]; // [x, y, z]

export interface Polytope4D {
  name: string;
  vertices: Vector4D[];
  edges: [number, number][]; // pairs of vertex indices
  cells?: number[][]; // face indices
}

// ---------------------------------------------------------------------------
// 4D Rotation Functions
// Rotations in 4D occur across 6 coordinate planes:
// XY, XZ, YZ (traditional 3D rotations)
// XW, YW, ZW (hyper-dimensional rotations through the 4th spatial dimension)
// ---------------------------------------------------------------------------

export function rotateXW([x, y, z, w]: Vector4D, angle: number): Vector4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - w * sin, y, z, x * sin + w * cos];
}

export function rotateYW([x, y, z, w]: Vector4D, angle: number): Vector4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y * cos - w * sin, z, y * sin + w * cos];
}

export function rotateZW([x, y, z, w]: Vector4D, angle: number): Vector4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y, z * cos - w * sin, z * sin + w * cos];
}

export function rotateXY([x, y, z, w]: Vector4D, angle: number): Vector4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - y * sin, x * sin + y * cos, z, w];
}

// ---------------------------------------------------------------------------
// 4D-to-3D Perspective / Stereographic Projection
// Projects 4D (x, y, z, w) into 3D (x', y', z') relative to a 4D camera distance d
// ---------------------------------------------------------------------------
export function project4Dto3D([x, y, z, w]: Vector4D, cameraDistance = 2.5): Vector3D {
  const d = Math.max(cameraDistance, 1.2);
  const factor = 1 / (d - w);
  return [x * factor, y * factor, z * factor];
}

// ---------------------------------------------------------------------------
// 4D Polytope Generators
// ---------------------------------------------------------------------------

/**
 * 1. The Tesseract (8-Cell / 4D Hypercube)
 * 16 vertices: (±1, ±1, ±1, ±1)
 * 32 edges connecting vertices that differ in exactly one coordinate
 */
export function generateTesseract(scale = 1.0): Polytope4D {
  const vertices: Vector4D[] = [];
  for (let i = 0; i < 16; i++) {
    const x = (i & 1 ? 1 : -1) * scale;
    const y = (i & 2 ? 1 : -1) * scale;
    const z = (i & 4 ? 1 : -1) * scale;
    const w = (i & 8 ? 1 : -1) * scale;
    vertices.push([x, y, z, w]);
  }

  const edges: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      // Connect if hamming distance is 1 (differ in exactly 1 bit)
      const diff = i ^ j;
      if ((diff & (diff - 1)) === 0) {
        edges.push([i, j]);
      }
    }
  }

  return {
    name: 'Tesseract (8-Cell Hypercube)',
    vertices,
    edges,
  };
}

/**
 * 2. The 16-Cell (Regular 4D Cross-Polytope / Hyperoctahedron)
 * 8 vertices: (±1, 0, 0, 0), (0, ±1, 0, 0), (0, 0, ±1, 0), (0, 0, 0, ±1)
 * 24 edges connecting all non-opposite vertex pairs
 */
export function generate16Cell(scale = 1.4): Polytope4D {
  const vertices: Vector4D[] = [
    [scale, 0, 0, 0],
    [-scale, 0, 0, 0],
    [0, scale, 0, 0],
    [0, -scale, 0, 0],
    [0, 0, scale, 0],
    [0, 0, -scale, 0],
    [0, 0, 0, scale],
    [0, 0, 0, -scale],
  ];

  const edges: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      // Every pair except antipodal opposites (i ^ 1 === j)
      if ((i ^ 1) !== j) {
        edges.push([i, j]);
      }
    }
  }

  return {
    name: '16-Cell (Hyperoctahedron)',
    vertices,
    edges,
  };
}

/**
 * 3. The 24-Cell (Octaplex)
 * Unique to 4 dimensions (has no 3D or higher dimensional analog!)
 * 24 vertices, 96 edges
 */
export function generate24Cell(scale = 1.2): Polytope4D {
  const vertices: Vector4D[] = [];

  // 8 vertices from permutations of (±1, 0, 0, 0)
  const axes = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  for (const axis of axes) {
    vertices.push([axis[0] * scale, axis[1] * scale, axis[2] * scale, axis[3] * scale]);
    vertices.push([-axis[0] * scale, -axis[1] * scale, -axis[2] * scale, -axis[3] * scale]);
  }

  // 16 vertices from (±0.5, ±0.5, ±0.5, ±0.5)
  const h = scale * 0.5;
  for (let i = 0; i < 16; i++) {
    vertices.push([
      (i & 1 ? h : -h),
      (i & 2 ? h : -h),
      (i & 4 ? h : -h),
      (i & 8 ? h : -h),
    ]);
  }

  // Edges: Connect pairs with Euclidean distance == scale
  const edges: [number, number][] = [];
  const targetDistSq = scale * scale;
  const eps = 0.01;

  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dx = vertices[i][0] - vertices[j][0];
      const dy = vertices[i][1] - vertices[j][1];
      const dz = vertices[i][2] - vertices[j][2];
      const dw = vertices[i][3] - vertices[j][3];
      const distSq = dx * dx + dy * dy + dz * dz + dw * dw;
      if (Math.abs(distSq - targetDistSq) < eps) {
        edges.push([i, j]);
      }
    }
  }

  return {
    name: '24-Cell (Octaplex)',
    vertices,
    edges,
  };
}

/**
 * 4. The Clifford Torus (4D Torus embedded in S3)
 * Parameterized by (cos(u), sin(u), cos(v), sin(v)) / sqrt(2)
 */
export function generateCliffordTorus(uSteps = 12, vSteps = 12, scale = 1.3): Polytope4D {
  const vertices: Vector4D[] = [];
  const edges: [number, number][] = [];
  const invSqrt2 = (1 / Math.SQRT2) * scale;

  for (let u = 0; u < uSteps; u++) {
    const angleU = (u / uSteps) * Math.PI * 2;
    const cosU = Math.cos(angleU) * invSqrt2;
    const sinU = Math.sin(angleU) * invSqrt2;

    for (let v = 0; v < vSteps; v++) {
      const angleV = (v / vSteps) * Math.PI * 2;
      const cosV = Math.cos(angleV) * invSqrt2;
      const sinV = Math.sin(angleV) * invSqrt2;

      vertices.push([cosU, sinU, cosV, sinV]);

      const currIdx = u * vSteps + v;
      const nextVIdx = u * vSteps + ((v + 1) % vSteps);
      const nextUIdx = ((u + 1) % uSteps) * vSteps + v;

      edges.push([currIdx, nextVIdx]);
      edges.push([currIdx, nextUIdx]);
    }
  }

  return {
    name: 'Clifford Torus (4D Torus)',
    vertices,
    edges,
  };
}
