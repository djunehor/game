import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHyper4DStore } from '../world/hyper4DStore';

interface BanknoteParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Vector3;
  life: number;
}

export function CashCannonVFX({ position = [0, 1.2, 0] }: { position?: [number, number, number] }) {
  const isCashCannonActive = useHyper4DStore((s) => s.isCashCannonActive);
  const banknotesGroupRef = useRef<THREE.Group>(null);

  // Initialize particle pool of 45 physical Nigerian Naira banknotes
  const particles: BanknoteParticle[] = useMemo(() => {
    return Array.from({ length: 45 }, () => ({
      pos: new THREE.Vector3(
        position[0] + (Math.random() - 0.5) * 0.4,
        position[1] + Math.random() * 0.5,
        position[2] + (Math.random() - 0.5) * 0.4
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        Math.random() * 5.5 + 3.0, // Launch upwards!
        (Math.random() - 0.5) * 4.5
      ),
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
      life: Math.random() * 3.5,
    }));
  }, [position]);

  useFrame((_, delta) => {
    if (!banknotesGroupRef.current) return;
    const meshes = banknotesGroupRef.current.children;

    for (let i = 0; i < particles.length && i < meshes.length; i++) {
      const p = particles[i];
      const m = meshes[i];

      if (isCashCannonActive) {
        // Physics: Velocity, gravity, drag
        p.pos.addScaledVector(p.vel, delta);
        p.vel.y -= 7.5 * delta; // Gravity
        p.vel.x *= 0.98; // Air resistance
        p.vel.z *= 0.98;

        // Ground collision bounce / settle
        if (p.pos.y < 0.05) {
          p.pos.y = 0.05;
          p.vel.y = -p.vel.y * 0.2;
        }

        // Tumble rotation
        p.rot.x += p.rotSpeed.x * delta;
        p.rot.y += p.rotSpeed.y * delta;
        p.rot.z += p.rotSpeed.z * delta;

        m.position.copy(p.pos);
        m.rotation.copy(p.rot);
        m.visible = true;
      } else {
        m.visible = false;
        // Reset positions near origin
        p.pos.set(
          position[0] + (Math.random() - 0.5) * 0.4,
          position[1] + Math.random() * 0.5,
          position[2] + (Math.random() - 0.5) * 0.4
        );
        p.vel.set(
          (Math.random() - 0.5) * 4.5,
          Math.random() * 5.5 + 3.0,
          (Math.random() - 0.5) * 4.5
        );
      }
    }
  });

  return (
    <group ref={banknotesGroupRef}>
      {particles.map((_, idx) => (
        <mesh key={`note-${idx}`} castShadow>
          {/* Rectangular Banknote Aspect Ratio (approx 150mm x 75mm) */}
          <boxGeometry args={[0.3, 0.002, 0.16]} />
          {/* Crisp Nigerian Naira Central Bank green/gold hue */}
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#15803d' : '#854d0e'}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
