import { VEHICLE_CATALOG, type VehicleType } from '../world/vehicleStore';

function OkadaModel({ color }: { color: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Front & Rear Wheels */}
      <mesh position={[0, 0.35, -0.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.14, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.35, 0.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.16, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      {/* Engine & Chassis */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.9]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Fuel Tank & Frame */}
      <mesh position={[0, 0.75, -0.2]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Leather Seat */}
      <mesh position={[0, 0.76, 0.3]} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.7]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>
      {/* Handlebars */}
      <mesh position={[0, 1.0, -0.6]} castShadow>
        <boxGeometry args={[0.8, 0.06, 0.06]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>
      {/* Headlight */}
      <mesh position={[0, 0.88, -0.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function KekeModel() {
  return (
    <group position={[0, 0, 0]}>
      {/* 3 Wheels: 1 front, 2 rear */}
      <mesh position={[0, 0.3, -1.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>
      <mesh position={[-0.65, 0.3, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.18, 16]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>
      <mesh position={[0.65, 0.3, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.18, 16]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>
      {/* Iconic Yellow Lower Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.5, 0.6, 2.4]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Black Canvas Canopy Roof */}
      <mesh position={[0, 1.55, 0.1]} castShadow>
        <boxGeometry args={[1.44, 0.15, 2.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Canopy Support Pillars */}
      {[-0.65, 0.65].map((px, i) => (
        <group key={`keke-pillar-${i}`}>
          <mesh position={[px, 1.15, -0.8]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[px, 1.15, 0.9]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Windshield */}
      <mesh position={[0, 1.15, -0.78]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[1.2, 0.7]} />
        <meshPhysicalMaterial transparent opacity={0.4} roughness={0.1} transmission={0.9} />
      </mesh>
      {/* Passenger Bench (Rear) */}
      <mesh position={[0, 0.75, 0.6]} castShadow>
        <boxGeometry args={[1.3, 0.2, 0.6]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Driver Seat & Handlebars */}
      <mesh position={[0, 0.75, -0.4]} castShadow>
        <boxGeometry args={[0.45, 0.2, 0.45]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Headlight */}
      <mesh position={[0, 0.7, -1.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function DanfoModel() {
  return (
    <group position={[0, 0, 0]}>
      {/* 4 Large Wheels */}
      {[-0.95, 0.95].map((wx, xi) => (
        <group key={`danfo-wheel-pair-${xi}`}>
          <mesh position={[wx, 0.45, -1.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.25, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          <mesh position={[wx, 0.45, 1.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.25, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Iconic Yellow Minibus Body */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[2.1, 1.4, 5.0]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Iconic Dual Black Speed Stripes */}
      <mesh position={[-1.06, 1.1, 0]}>
        <boxGeometry args={[0.02, 0.15, 4.8]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
      <mesh position={[1.06, 1.1, 0]}>
        <boxGeometry args={[0.02, 0.15, 4.8]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
      {/* Windshield & Windows */}
      <mesh position={[0, 1.5, -2.52]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[1.8, 0.8]} />
        <meshPhysicalMaterial transparent opacity={0.4} roughness={0.1} transmission={0.9} />
      </mesh>
      {/* White Roof Trim */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[2.0, 0.12, 4.9]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Dual Headlights */}
      {[-0.7, 0.7].map((lx, li) => (
        <mesh key={`danfo-light-${li}`} position={[lx, 0.85, -2.53]} castShadow>
          <boxGeometry args={[0.25, 0.18, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function InnosonCarModel({ color = '#0284c7' }: { color?: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* 4 Alloy Wheels */}
      {[-0.95, 0.95].map((wx, xi) => (
        <group key={`car-wheel-pair-${xi}`}>
          <mesh position={[wx, 0.4, -1.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.24, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[wx, 0.4, 1.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.24, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Sleek SUV Lower Chassis */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[2.0, 0.65, 4.4]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Cabin & Tinted Windows */}
      <mesh position={[0, 1.25, 0.1]} castShadow>
        <boxGeometry args={[1.75, 0.6, 2.6]} />
        <meshPhysicalMaterial color="#0f172a" metalness={0.7} roughness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* Front Chrome Grille */}
      <mesh position={[0, 0.6, -2.22]} castShadow>
        <boxGeometry args={[1.4, 0.35, 0.08]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* LED Headlights */}
      {[-0.7, 0.7].map((lx, li) => (
        <mesh key={`car-light-${li}`} position={[lx, 0.72, -2.22]} castShadow>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function VehicleVisualModel({ type }: { type: VehicleType }) {
  if (type === 'bike') return <OkadaModel color={VEHICLE_CATALOG.bike.modelColor} />;
  if (type === 'keke_napep') return <KekeModel />;
  if (type === 'danfo_bus') return <DanfoModel />;
  if (type === 'car') return <InnosonCarModel color={VEHICLE_CATALOG.car.modelColor} />;
  return null;
}
