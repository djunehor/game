import {
  getParquetTexture,
  getMarbleTexture,
  getAcousticSlatTexture,
  getLuxuryRugTexture,
} from './textures';
import { SwimmingPool } from './SwimmingPool';
import { SolidObject } from './SolidObject';

// High-fidelity architectural furniture and set props for the Biggie House.

// ============================================================================
// 1. MAIN LOUNGE (Living Room, Eviction Couch & House Meetings)
// ============================================================================
export function LoungeFurniture() {
  const rugTex = getLuxuryRugTexture('#1e293b', '#eab308');
  const mediaWallTex = getAcousticSlatTexture(3, 1);

  return (
    <group position={[-10, 0, 4]}>
      {/* 1. Designer Geometric Luxury Area Rug */}
      <mesh position={[0, 0.04, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.6, 9.8]} />
        <meshStandardMaterial map={rugTex} roughness={0.85} />
      </mesh>

      {/* Rug Edge Tassels */}
      {[-5.8, 5.8].map((rx, idx) => (
        <mesh key={`rug-fringe-${idx}`} position={[rx, 0.045, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 9.6]} />
          <meshStandardMaterial color="#fef08a" roughness={0.9} />
        </mesh>
      ))}

      {/* 2. Main Sectional Sofa - Left Wing */}
      <SolidObject name="Lounge Sofa Left" position={[-4.2, 0, 0]}>
        {/* Plinth Base */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.35, 5.2]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
        {/* Cushioned Main Body */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.3, 0.35, 5.0]} />
          <meshStandardMaterial color="#991b1b" roughness={0.65} />
        </mesh>
        {/* Ergonomic Curved Backrest */}
        <mesh position={[-1.0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.5, 0.75, 5.0]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
        {/* Plush Seat Cushions */}
        {[-1.3, 1.3].map((cz, i) => (
          <mesh key={`cushion-l-${i}`} position={[0.05, 0.68, cz]} castShadow>
            <boxGeometry args={[1.5, 0.16, 2.2]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
        ))}
        {/* Accent Throw Pillows */}
        <mesh position={[-0.6, 0.8, -1.8]} rotation={[0.2, 0.4, 0]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.2]} />
          <meshStandardMaterial color="#eab308" roughness={0.5} />
        </mesh>
        <mesh position={[-0.6, 0.8, 1.8]} rotation={[-0.2, -0.3, 0]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.2]} />
          <meshStandardMaterial color="#059669" roughness={0.5} />
        </mesh>
      </SolidObject>

      {/* Main Sectional Sofa - Center Back */}
      <SolidObject name="Lounge Sofa Center" position={[0, 0, -2.4]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.2, 0.35, 2.2]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.0, 0.35, 2.1]} />
          <meshStandardMaterial color="#991b1b" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.9, -0.85]} castShadow>
          <boxGeometry args={[6.0, 0.75, 0.45]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
        {/* Center Seat Cushions */}
        {[-1.8, 0, 1.8].map((cx, i) => (
          <mesh key={`cushion-c-${i}`} position={[cx, 0.68, 0.1]} castShadow>
            <boxGeometry args={[1.65, 0.16, 1.4]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
        ))}
      </SolidObject>

      {/* Right Wing Sofa */}
      <SolidObject name="Lounge Sofa Right" position={[4.2, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.35, 5.2]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.3, 0.35, 5.0]} />
          <meshStandardMaterial color="#991b1b" roughness={0.65} />
        </mesh>
        <mesh position={[1.0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.5, 0.75, 5.0]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
        </mesh>
        {/* Plush Cushions */}
        {[-1.3, 1.3].map((cz, i) => (
          <mesh key={`cushion-r-${i}`} position={[-0.05, 0.68, cz]} castShadow>
            <boxGeometry args={[1.5, 0.16, 2.2]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
        ))}
        {/* Accent Throw Pillows */}
        <mesh position={[0.6, 0.8, -1.8]} rotation={[0.2, -0.4, 0]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.2]} />
          <meshStandardMaterial color="#eab308" roughness={0.5} />
        </mesh>
        <mesh position={[0.6, 0.8, 1.8]} rotation={[-0.2, 0.3, 0]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.2]} />
          <meshStandardMaterial color="#059669" roughness={0.5} />
        </mesh>
      </SolidObject>

      {/* 3. Luxury Glass & Gold Coffee Table */}
      <SolidObject name="Lounge Coffee Table" position={[0, 0, 0.6]}>
        {/* Brass Legs & Frame */}
        {[-2.0, 2.0].map((lx, i) =>
          [-1.1, 1.1].map((lz, j) => (
            <mesh key={`ct-leg-${i}-${j}`} position={[lx, 0.22, lz]}>
              <cylinderGeometry args={[0.045, 0.045, 0.44, 16]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
            </mesh>
          ))
        )}
        {/* Perimeter Brass Trim */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[4.4, 0.04, 2.5]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Smoked Tempered Glass Top */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.25, 0.04, 2.35]} />
          <meshStandardMaterial color="#0f172a" transparent opacity={0.88} roughness={0.08} metalness={0.3} />
        </mesh>

        {/* Traditional Ayo Olopon Wooden Game Board */}
        <group position={[0.9, 0.5, -0.1]} rotation={[0, -0.15, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.08, 0.52]} />
            <meshStandardMaterial color="#3f1a07" roughness={0.4} />
          </mesh>
          {[-0.55, -0.33, -0.11, 0.11, 0.33, 0.55].map((px) => (
            <group key={`pit-${px}`}>
              <mesh position={[px, 0.045, -0.13]}>
                <cylinderGeometry args={[0.075, 0.075, 0.02, 16]} />
                <meshStandardMaterial color="#1f0c02" />
              </mesh>
              <mesh position={[px, 0.045, 0.13]}>
                <cylinderGeometry args={[0.075, 0.075, 0.02, 16]} />
                <meshStandardMaterial color="#1f0c02" />
              </mesh>
            </group>
          ))}
        </group>

        {/* Truth or Dare Bottle */}
        <mesh position={[-1.0, 0.54, 0.2]} rotation={[0, 0.8, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.11, 0.48, 16]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.75} roughness={0.1} />
        </mesh>
      </SolidObject>

      {/* 4. Feature Acoustic Slat Entertainment Wall with Biggie 85" OLED TV */}
      <SolidObject name="Lounge TV Wall" position={[0, 2.8, -6.8]}>
        {/* Acoustic Dark Walnut Slat Backdrop */}
        <mesh position={[0, 0, -0.05]} receiveShadow>
          <boxGeometry args={[8.2, 4.0, 0.15]} />
          <meshStandardMaterial map={mediaWallTex} roughness={0.5} />
        </mesh>

        {/* TV Screen Outer Frame */}
        <mesh position={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[6.6, 2.8, 0.1]} />
          <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* TV Display with Backlight Glow */}
        <mesh position={[0, 0, 0.18]}>
          <planeGeometry args={[6.3, 2.5]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* Big Brother Naija Iconic Eye Graphic on TV */}
        <mesh position={[0, 0, 0.2]}>
          <ringGeometry args={[0.7, 0.9, 48]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0, 0, 0.21]}>
          <circleGeometry args={[0.48, 48]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <circleGeometry args={[0.22, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Floating Media Console Credenza below TV */}
        <group position={[0, -1.8, 0.4]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6.8, 0.55, 0.8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          {/* Gold Hardware Accents */}
          {[-2.0, 0, 2.0].map((hx, idx) => (
            <mesh key={`handle-${idx}`} position={[hx, 0, 0.42]}>
              <boxGeometry args={[0.4, 0.03, 0.04]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </SolidObject>

      {/* 5. Sculpted Tropical Monstera & Fiddle-Leaf Fig Houseplants */}
      {[-5.8, 5.8].map((px, idx) => (
        <group key={`plant-${idx}`} position={[px, 0, -5.4]}>
          {/* Fluted Ceramic Planter Pot */}
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.6, 0.45, 1.2, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Potting Soil */}
          <mesh position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.56, 0.56, 0.1, 20]} />
            <meshStandardMaterial color="#27190f" roughness={0.95} />
          </mesh>
          {/* Central Stem */}
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 1.6, 12]} />
            <meshStandardMaterial color="#4d7c0f" roughness={0.7} />
          </mesh>
          {/* Layered Tropical Leaves */}
          {[0, 1, 2, 3, 4, 5].map((leafIdx) => {
            const rotY = leafIdx * 1.05;
            const yPos = 1.6 + leafIdx * 0.25;
            return (
              <mesh
                key={`leaf-${leafIdx}`}
                position={[Math.cos(rotY) * 0.4, yPos, Math.sin(rotY) * 0.4]}
                rotation={[0.35, rotY, 0.25]}
                castShadow
              >
                <boxGeometry args={[0.65, 0.02, 0.9]} />
                <meshStandardMaterial color={leafIdx % 2 === 0 ? '#15803d' : '#16a34a'} roughness={0.35} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 2. KITCHEN & DINING (Culinary Island, Marble Finishes & Appliances)
// ============================================================================
export function KitchenFurniture() {
  const marbleTex = getMarbleTexture(3, 2);

  return (
    <group position={[-10, 0, -11]}>
      {/* 1. Luxurious Waterfall Calacatta Marble Kitchen Island */}
      <SolidObject name="Kitchen Island" position={[0, 0, 0]}>
        {/* Dark Fluted Oak Base Cabinetry */}
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.2, 0.96, 1.9]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* Polished Marble Waterfall Top */}
        <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.6, 0.12, 2.2]} />
          <meshStandardMaterial map={marbleTex} roughness={0.12} metalness={0.08} />
        </mesh>
        {/* Waterfall End Panels (Left & Right) */}
        <mesh position={[-2.75, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 1.0, 2.2]} />
          <meshStandardMaterial map={marbleTex} roughness={0.12} metalness={0.08} />
        </mesh>
        <mesh position={[2.75, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 1.0, 2.2]} />
          <meshStandardMaterial map={marbleTex} roughness={0.12} metalness={0.08} />
        </mesh>

        {/* Authentic Nigerian Jollof Party Pot */}
        <group position={[-1.4, 1.1, 0]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.42, 0.64, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.67, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Brass Pot Handles */}
          {[-0.52, 0.52].map((hx, i) => (
            <mesh key={`p-handle-${i}`} position={[hx, 0.42, 0]}>
              <boxGeometry args={[0.1, 0.06, 0.18]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} />
            </mesh>
          ))}
        </group>

        {/* Double-Basin Undermount Stainless Steel Sink & Faucet */}
        <group position={[1.2, 1.08, 0]}>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[1.4, 0.1, 0.8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Gooseneck Chrome Faucet */}
          <mesh position={[0, 0.25, -0.3]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
          </mesh>
          <mesh position={[0, 0.48, -0.15]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.35, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
          </mesh>
        </group>
      </SolidObject>

      {/* 2. Velvet Upholstered Bar Stools with Gold Hairpin Legs */}
      {[-1.6, 0, 1.6].map((x, idx) => (
        <group key={`stool-${idx}`} position={[x, 0, 1.7]}>
          {/* Gold Legs */}
          {[-0.2, 0.2].map((lx, i) =>
            [-0.2, 0.2].map((lz, j) => (
              <mesh key={`leg-${i}-${j}`} position={[lx, 0.38, lz]}>
                <cylinderGeometry args={[0.02, 0.02, 0.76, 12]} />
                <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
              </mesh>
            ))
          )}
          {/* Footrest Ring */}
          <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.015, 12, 24]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </mesh>
          {/* Curved Velvet Seat Cushion */}
          <mesh position={[0, 0.78, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.1, 24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.6} />
          </mesh>
          {/* Low Curved Backrest */}
          <mesh position={[0, 0.95, 0.24]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.55, 0.25, 0.08]} />
            <meshStandardMaterial color="#0369a1" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* 3. Built-In Stainless French-Door Smart Refrigerator */}
      <SolidObject name="Kitchen Fridge" position={[-4.8, 0, -4.5]}>
        <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 3.4, 1.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.18} />
        </mesh>
        {/* Full-Length Chrome Handles */}
        {[-0.1, 0.1].map((hx, idx) => (
          <mesh key={`fridge-h-${idx}`} position={[hx, 1.7, 0.72]}>
            <boxGeometry args={[0.035, 1.2, 0.04]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
        {/* Ice & Water Touch Dispenser */}
        <mesh position={[-0.5, 2.0, 0.71]}>
          <planeGeometry args={[0.4, 0.55]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
      </SolidObject>

      {/* 4. Modern Induction Cooktop & Stainless Steel Range Hood */}
      <SolidObject name="Kitchen Stove" position={[3.6, 0, -4.5]}>
        {/* Cabinet Counter Base */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 1.0, 1.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <boxGeometry args={[2.85, 0.06, 1.45]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.6} />
        </mesh>
        {/* 4 Blue-Ring Induction Cooking Zones */}
        {[-0.5, 0.5].map((bx, i) =>
          [-0.25, 0.25].map((bz, j) => (
            <mesh key={`burner-${i}-${j}`} position={[bx, 1.06, bz]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.15, 0.22, 32]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          ))
        )}
        {/* Stainless Steel Range Hood with Downlights */}
        <group position={[0, 2.8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 0.35, 1.3]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1.4, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </SolidObject>
    </group>
  );
}

// ============================================================================
// 3. DIARY ROOM (Biggie's Iconic Confessional Suite)
// ============================================================================
export function DiaryRoomFurniture() {
  return (
    <group position={[-20, 0, 18]}>
      {/* 1. Soundstage Diamond Acoustic Soundproof Carpet */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.5, 8.8]} />
        <meshStandardMaterial color="#09090b" roughness={0.95} />
      </mesh>

      {/* 2. The Iconic Big Brother Royal Gold Wingback Throne */}
      <SolidObject name="Diary Room Chair" position={[0, 0, -0.6]}>
        {/* Ornate Gold Pedestal Base */}
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.75, 0.88, 0.32, 32]} />
          <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.18} />
        </mesh>
        {/* Deep Crimson Velvet Tufted Seat */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.82, 0.75, 0.55, 32]} />
          <meshStandardMaterial color="#701a75" roughness={0.45} />
        </mesh>
        {/* Majestic High-Back Wingback */}
        <mesh position={[0, 1.6, -0.48]} castShadow>
          <boxGeometry args={[1.65, 1.8, 0.38]} />
          <meshStandardMaterial color="#581c87" roughness={0.45} />
        </mesh>
        {/* Diamond Tufting Buttons (Gold Studs) */}
        {[-0.45, 0, 0.45].map((bx, i) =>
          [1.1, 1.5, 1.9, 2.3].map((by, j) => (
            <mesh key={`stud-${i}-${j}`} position={[bx, by, -0.28]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
            </mesh>
          ))
        )}
        {/* Left and Right Velvet Armrests with Gold Scroll Finials */}
        {[-0.82, 0.82].map((ax, idx) => (
          <group key={`arm-${idx}`} position={[ax, 0.9, -0.1]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.48, 0.95]} />
              <meshStandardMaterial color="#7e22ce" roughness={0.45} />
            </mesh>
            {/* Gold Front Scroll Trim */}
            <mesh position={[0, -0.05, 0.48]}>
              <cylinderGeometry args={[0.13, 0.13, 0.26, 16]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </SolidObject>

      {/* 3. Big Brother Wall Logo Sculpture (Multi-Ring Neon Eye) */}
      <group position={[0, 2.6, -4.4]}>
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[1.2, 1.45, 48]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <ringGeometry args={[0.7, 0.95, 48]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <circleGeometry args={[0.42, 32]} />
          <meshBasicMaterial color="#ec4899" />
        </mesh>
      </group>

      {/* 4. Overhead Studio Broadcast Microphone */}
      <group position={[0, 2.4, 0.7]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Atmospheric Drama Spotlights */}
      <spotLight position={[0, 4.6, 2.2]} target-position={[0, 1.2, -0.5]} intensity={4.5} angle={0.7} penumbra={0.45} color="#c084fc" />
    </group>
  );
}

// ============================================================================
// 4. HEAD OF HOUSE (HoH) PRESIDENTIAL SUITE
// ============================================================================
export function HohSuiteFurniture() {
  const parquetTex = getParquetTexture(3, 3);

  return (
    <group position={[16, 0, -21]}>
      {/* 1. Golden Wood Floor Dais Platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[11.5, 0.3, 9.5]} />
        <meshStandardMaterial map={parquetTex} roughness={0.4} />
      </mesh>

      {/* 2. Presidential 4-Poster King Canopy Bed */}
      <SolidObject name="HoH King Canopy Bed" position={[0, 0.3, -2.2]}>
        {/* Four Gold Posts */}
        {[-2.1, 2.1].map((px, i) =>
          [-2.1, 2.1].map((pz, j) => (
            <mesh key={`post-${i}-${j}`} position={[px, 1.6, pz]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 3.2, 16]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
            </mesh>
          ))
        )}
        {/* Top Canopy Crossbars */}
        <mesh position={[0, 3.2, -2.1]}>
          <boxGeometry args={[4.25, 0.06, 0.06]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[0, 3.2, 2.1]}>
          <boxGeometry args={[4.25, 0.06, 0.06]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[-2.1, 3.2, 0]}>
          <boxGeometry args={[0.06, 0.06, 4.25]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[2.1, 3.2, 0]}>
          <boxGeometry args={[0.06, 0.06, 4.25]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>

        {/* Channel-Tufted Velvet Headboard */}
        <mesh position={[0, 1.4, -2.05]} castShadow>
          <boxGeometry args={[4.1, 1.8, 0.25]} />
          <meshStandardMaterial color="#064e3b" roughness={0.5} />
        </mesh>
        {/* Mattress with Crisp White Egyptian Cotton Bedding */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.9, 0.65, 4.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
        {/* Gold Silk Duvet & Bed Runner */}
        <mesh position={[0, 0.85, 0.4]}>
          <boxGeometry args={[3.85, 0.16, 3.1]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.25} />
        </mesh>
        {/* 4 Plump Pillows */}
        {[-1.1, 1.1].map((px, i) => (
          <group key={`pillow-pair-${i}`} position={[px, 1.0, -1.3]}>
            <mesh position={[0, 0, 0]} rotation={[0.3, 0, 0]} castShadow>
              <boxGeometry args={[1.2, 0.22, 0.75]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.12, 0.25]} rotation={[0.45, 0, 0]}>
              <boxGeometry args={[1.0, 0.18, 0.6]} />
              <meshStandardMaterial color="#fef08a" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </SolidObject>

      {/* 3. HoH Private Executive Desk & Nomination Box */}
      <SolidObject name="HoH Desk" position={[3.8, 0.3, 2.2]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.84, 1.1]} />
          <meshStandardMaterial color="#451a03" roughness={0.4} />
        </mesh>
        {/* Gold Nomination Box */}
        <mesh position={[0.4, 0.92, 0]} castShadow>
          <boxGeometry args={[0.45, 0.28, 0.35]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
        </mesh>
        {/* Executive Armchair */}
        <mesh position={[0, 0.6, 0.8]} castShadow>
          <boxGeometry args={[0.9, 1.0, 0.8]} />
          <meshStandardMaterial color="#064e3b" roughness={0.6} />
        </mesh>
      </SolidObject>

      {/* 4. Luxury Champagne Stand & Ice Bucket */}
      <group position={[-3.8, 0.3, 2.2]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 16]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.3, 0.2, 0.4, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.08} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 5. GARDEN & OUTDOOR RESORT AREA
// ============================================================================
export function GardenFurniture() {
  return (
    <group position={[16, 0, -2]}>
      {/* 1. Realistic Luxury Swimming Pool Component with Animated Water Shader */}
      <SolidObject name="Garden Swimming Pool">
        <SwimmingPool />
      </SolidObject>

      {/* 2. Tropical Garden Palms along the Compound Wall */}
      {[-10, 10].map((pz, idx) => (
        <group key={`palm-${idx}`} position={[6.8, 0, pz]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.26, 4.4, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4.6, 0]} castShadow>
            <sphereGeometry args={[1.8, 16, 16]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 6. ARENA GAMES (Friday Night Arena Tasks & Vehicle Prop)
// ============================================================================
export function ArenaFurniture() {
  return (
    <group position={[16, 0, 20]}>
      {/* 1. Synthetic Polyurethane Arena Running Track */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.5, 8.5]} />
        <meshStandardMaterial color="#991b1b" roughness={0.85} />
      </mesh>
      {/* Track Lanes */}
      {[-2.5, 0, 2.5].map((x, idx) => (
        <mesh key={`lane-${idx}`} position={[x, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 8.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* 2. Obstacle Course Slalom Cones */}
      {[-3, -1, 1, 3].map((x, idx) => (
        <mesh key={`cone-${idx}`} position={[x, 0.35, 1.8]} castShadow>
          <coneGeometry args={[0.26, 0.72, 16]} />
          <meshStandardMaterial color="#f97316" roughness={0.3} />
        </mesh>
      ))}

      {/* 3. Authentic Winner's Trophy Podium */}
      <SolidObject name="Arena Challenge Podium" position={[0, 0, -2.6]}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[1.3, 0.96, 1.3]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-1.4, 0.32, 0]} castShadow>
          <boxGeometry args={[1.2, 0.64, 1.2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[1.4, 0.22, 0]} castShadow>
          <boxGeometry args={[1.2, 0.44, 1.2]} />
          <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.2} />
        </mesh>
      </SolidObject>

      {/* 4. The Legendary Innoson SUV Task Display Vehicle */}
      <SolidObject name="Arena Innoson SUV Prop" position={[-2.8, 0, -1.0]} rotation={[0, 0.25, 0]}>
        {/* Sculpted Automotive Body Chassis */}
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.52, 3.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.18} />
        </mesh>
        {/* Cabin Glass & Roof */}
        <mesh position={[0, 0.9, -0.2]} castShadow>
          <boxGeometry args={[1.5, 0.48, 1.9]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.18} />
        </mesh>
        {/* Tinted Front Windshield */}
        <mesh position={[0, 0.9, 0.85]} rotation={[-0.42, 0, 0]}>
          <boxGeometry args={[1.42, 0.44, 0.08]} />
          <meshStandardMaterial color="#0f172a" transparent opacity={0.85} roughness={0.05} metalness={0.6} />
        </mesh>
        {/* Chrome Front Grille */}
        <mesh position={[0, 0.48, 1.72]}>
          <boxGeometry args={[1.2, 0.24, 0.05]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* LED Headlights */}
        {[-0.65, 0.65].map((hx, i) => (
          <mesh key={`hl-${i}`} position={[hx, 0.52, 1.72]}>
            <boxGeometry args={[0.32, 0.14, 0.04]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        ))}
        {/* 4 Alloy Wheels with Rubber Tires */}
        {[-0.95, 0.95].map((wx, i) =>
          [-1.1, 1.1].map((wz, j) => (
            <group key={`wheel-${i}-${j}`} position={[wx, 0.24, wz]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.22, 20]} />
                <meshStandardMaterial color="#18181b" roughness={0.9} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.15, 0.15, 0.24, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
              </mesh>
            </group>
          ))
        )}
      </SolidObject>
    </group>
  );
}

// ============================================================================
// 7. BEDROOM (Twin Housemate Beds & Vanity Suite)
// ============================================================================
export function BedroomFurniture() {
  const rugTex = getLuxuryRugTexture('#334155', '#38bdf8');

  return (
    <group position={[-6, 0, 18]}>
      {/* 1. Plush Bedroom Carpet */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.5, 9.5]} />
        <meshStandardMaterial map={rugTex} roughness={0.9} />
      </mesh>

      {/* 2. Twin Housemate Beds */}
      {[-3.2, 3.2].map((x, idx) => (
        <SolidObject key={`bed-${idx}`} name={`Bedroom Queen Bed ${idx + 1}`} position={[x, 0, 0]}>
          {/* Wooden Bed Base */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.6, 4.4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          {/* Plush Upholstered Headboard */}
          <mesh position={[0, 1.2, -2.1]} castShadow>
            <boxGeometry args={[3.2, 1.2, 0.25]} />
            <meshStandardMaterial color={idx === 0 ? '#0369a1' : '#be123c'} roughness={0.6} />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[3.0, 0.35, 4.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          {/* Colorful Ankara/Geometric Duvet */}
          <mesh position={[0, 0.85, 0.4]}>
            <boxGeometry args={[2.95, 0.12, 3.2]} />
            <meshStandardMaterial color={idx === 0 ? '#0284c7' : '#e11d48'} roughness={0.55} />
          </mesh>
          {/* Fluffy Pillows */}
          {[-0.75, 0.75].map((px, pi) => (
            <mesh key={`p-${pi}`} position={[px, 1.0, -1.4]} rotation={[0.25, 0, 0]} castShadow>
              <boxGeometry args={[1.1, 0.24, 0.75]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          ))}
        </SolidObject>
      ))}

      {/* 3. Vanity Dressing Mirror with Hollywood Perimeter Lighting */}
      <SolidObject name="Bedroom Vanity" position={[0, 0, 4.4]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[2.6, 2.8, 0.15]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* High-Reflectance Mirror Surface */}
        <mesh position={[0, 1.5, 0.09]}>
          <planeGeometry args={[2.2, 2.4]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.96} roughness={0.04} />
        </mesh>
        {/* Hollywood Globe Perimeter Lights */}
        {[-1.0, 1.0].map((lx, i) =>
          [0.6, 1.2, 1.8, 2.4].map((ly, j) => (
            <mesh key={`bulb-${i}-${j}`} position={[lx, ly, 0.12]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
          ))
        )}
      </SolidObject>
    </group>
  );
}
