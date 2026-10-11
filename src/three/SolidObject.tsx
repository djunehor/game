import { useRef, useLayoutEffect, type ReactNode, type ComponentProps } from 'react';
import * as THREE from 'three';
import { registerSolidObject, unregisterSolidObject } from './collisionStore';

interface SolidObjectProps extends ComponentProps<'group'> {
  name: string;
  children: ReactNode;
}

/**
 * SolidObject wrapper for high-fidelity furniture and props.
 * Automatically computes world AABB directly from Three.js scene geometry,
 * removing the need for manual coordinate lists.
 */
export function SolidObject({ name, children, ...groupProps }: SolidObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (groupRef.current) {
      registerSolidObject(groupRef.current, name);
    }
    return () => {
      unregisterSolidObject(name);
    };
  }, [name]);

  return (
    <group ref={groupRef} userData={{ isSolid: true, solidName: name }} {...groupProps}>
      {children}
    </group>
  );
}
