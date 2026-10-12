import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  generateTesseract,
  generate16Cell,
  generate24Cell,
  generateCliffordTorus,
  rotateXW,
  rotateYW,
  rotateZW,
  rotateXY,
  project4Dto3D,
  type Polytope4D,
  type Vector4D,
} from '../math/hyper4D';
import { useHyper4DStore, HYPER_THEMES, type PolytopeType, type HyperColorTheme } from '../world/hyper4DStore';

interface HyperTesseractProps {
  polytopeType?: PolytopeType;
  scale?: number;
  overrideTheme?: HyperColorTheme;
  isMiniature?: boolean; // When worn as an avatar crown
}

export function HyperTesseract3D({
  polytopeType,
  scale = 1.0,
  overrideTheme,
  isMiniature = false,
}: HyperTesseractProps) {
  const storePolytope = useHyper4DStore((s) => s.activePolytope);
  const storeTheme = useHyper4DStore((s) => s.colorTheme);
  const speedXW = useHyper4DStore((s) => s.speedXW);
  const speedYW = useHyper4DStore((s) => s.speedYW);
  const speedZW = useHyper4DStore((s) => s.speedZW);
  const cameraDistance4D = useHyper4DStore((s) => s.cameraDistance4D);

  const activeType = polytopeType || storePolytope || 'tesseract';
  const activeThemeKey = overrideTheme || storeTheme || 'neon_cyan';
  const theme = HYPER_THEMES[activeThemeKey];

  // Base 4D geometry definition
  const basePolytope: Polytope4D = useMemo(() => {
    switch (activeType) {
      case '16cell':
        return generate16Cell(1.3 * scale);
      case '24cell':
        return generate24Cell(1.1 * scale);
      case 'clifford_torus':
        return generateCliffordTorus(10, 10, 1.2 * scale);
      case 'tesseract':
      default:
        return generateTesseract(1.0 * scale);
    }
  }, [activeType, scale]);

  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);
  const nodesGroupRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef({ xw: 0, yw: 0, zw: 0, xy: 0 });

  // Pre-allocate vertex buffers for edges
  const linePositions = useMemo(() => {
    const edgeCount = basePolytope.edges.length;
    return new Float32Array(edgeCount * 2 * 3); // 2 vertices per edge, 3 coords each
  }, [basePolytope.edges.length]);

  useFrame((_, delta) => {
    // Increment 4D rotation angles
    const speedMult = isMiniature ? 0.7 : 1.0;
    angleRef.current.xw += delta * (speedXW ?? 0.8) * speedMult;
    angleRef.current.yw += delta * (speedYW ?? 0.6) * speedMult;
    angleRef.current.zw += delta * (speedZW ?? 0.4) * speedMult;
    angleRef.current.xy += delta * 0.3 * speedMult;

    // Rotate and project all 4D vertices into 3D
    const projected3D: THREE.Vector3[] = basePolytope.vertices.map((v: Vector4D) => {
      let r = rotateXW(v, angleRef.current.xw);
      r = rotateYW(r, angleRef.current.yw);
      r = rotateZW(r, angleRef.current.zw);
      r = rotateXY(r, angleRef.current.xy);
      const [px, py, pz] = project4Dto3D(r, cameraDistance4D ?? 2.6);
      return new THREE.Vector3(px, py, pz);
    });

    // Update edge line segment coordinates
    if (lineGeometryRef.current) {
      const posAttr = lineGeometryRef.current.attributes.position as THREE.BufferAttribute;
      if (posAttr) {
        let ptr = 0;
        for (const [i, j] of basePolytope.edges) {
          const v1 = projected3D[i];
          const v2 = projected3D[j];
          if (v1 && v2) {
            posAttr.setXYZ(ptr++, v1.x, v1.y, v1.z);
            posAttr.setXYZ(ptr++, v2.x, v2.y, v2.z);
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Update vertex node positions
    if (nodesGroupRef.current) {
      const children = nodesGroupRef.current.children;
      for (let i = 0; i < children.length && i < projected3D.length; i++) {
        const p = projected3D[i];
        children[i].position.set(p.x, p.y, p.z);
      }
    }

    // Pulsate central singularity core
    if (innerCoreRef.current) {
      const pulse = 1 + Math.sin(angleRef.current.xw * 3) * 0.15;
      innerCoreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const nodeRadius = isMiniature ? 0.03 : 0.06;

  return (
    <group>
      {/* 4D Edges (Projected 3D Line Segments) */}
      <lineSegments>
        <bufferGeometry ref={lineGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={theme.primary}
          linewidth={isMiniature ? 1 : 2}
          transparent
          opacity={0.85}
        />
      </lineSegments>

      {/* 4D Vertex Nodes (Projected 3D Spheres at each hyper-corner) */}
      <group ref={nodesGroupRef}>
        {basePolytope.vertices.map((_, idx) => (
          <mesh key={`node-${idx}`}>
            <sphereGeometry args={[nodeRadius, 8, 8]} />
            <meshStandardMaterial
              color={theme.vertex}
              emissive={theme.glow}
              emissiveIntensity={1.8}
            />
          </mesh>
        ))}
      </group>

      {/* Pulsating 4D Core Singularity */}
      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[isMiniature ? 0.08 : 0.22, 1]} />
        <meshStandardMaterial
          color={theme.secondary}
          emissive={theme.primary}
          emissiveIntensity={2.0}
          wireframe
        />
      </mesh>

      {/* Orbiting Hyper-Dimensional Ring */}
      {!isMiniature && (
        <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          <mesh>
            <torusGeometry args={[1.5 * scale, 0.02, 16, 64]} />
            <meshStandardMaterial
              color={theme.vertex}
              emissive={theme.primary}
              emissiveIntensity={1.2}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
