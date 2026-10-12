import {
  rotateXW,
  rotateYW,
  rotateZW,
  rotateXY,
  project4Dto3D,
  generateTesseract,
  generate16Cell,
  generate24Cell,
  generateCliffordTorus,
  type Vector4D,
} from '../src/math/hyper4D';
import { useHyper4DStore } from '../src/world/hyper4DStore';
import { useEconomyStore } from '../src/world/economyStore';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log('→ Testing 4D Hyper-Dimensional Mathematics & Quantum Engine');

// 1. Vector Norm Conservation under 4D Rotation
function norm4D([x, y, z, w]: Vector4D): number {
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

const v0: Vector4D = [1, 2, 3, 4];
const initialNorm = norm4D(v0);

const rXW = rotateXW(v0, Math.PI / 3);
assert(Math.abs(norm4D(rXW) - initialNorm) < 1e-6, 'rotateXW preserves 4D Euclidean norm');

const rYW = rotateYW(v0, Math.PI / 4);
assert(Math.abs(norm4D(rYW) - initialNorm) < 1e-6, 'rotateYW preserves 4D Euclidean norm');

const rZW = rotateZW(v0, Math.PI / 6);
assert(Math.abs(norm4D(rZW) - initialNorm) < 1e-6, 'rotateZW preserves 4D Euclidean norm');

const rXY = rotateXY(v0, Math.PI / 5);
assert(Math.abs(norm4D(rXY) - initialNorm) < 1e-6, 'rotateXY preserves 4D Euclidean norm');

// 2. 4D-to-3D Perspective Projection Mathematics
const pCenter = project4Dto3D([0, 0, 0, 0], 2.5);
assert(pCenter[0] === 0 && pCenter[1] === 0 && pCenter[2] === 0, '4D origin projects to 3D origin');

const pClose = project4Dto3D([1, 1, 1, 1], 2.0); // d - w = 1.0 => factor = 1.0
assert(Math.abs(pClose[0] - 1.0) < 1e-6, 'Perspective projection factors accurately (close w=1)');

const pFar = project4Dto3D([1, 1, 1, -1], 2.0); // d - w = 3.0 => factor = 1/3
assert(Math.abs(pFar[0] - 1 / 3) < 1e-6, 'Perspective projection expands/contracts with hyper-depth w');

// 3. 4D Polytope Topological Generators
// Tesseract: 16 vertices, 32 edges
const tesseract = generateTesseract(1.0);
assert(tesseract.vertices.length === 16, 'Tesseract has exactly 16 vertices in 4-space');
assert(tesseract.edges.length === 32, 'Tesseract has exactly 32 hypercube edges');
assert(tesseract.name.includes('Tesseract'), 'Tesseract identifier valid');

// 16-Cell (Hyperoctahedron): 8 vertices, 24 edges
const cell16 = generate16Cell(1.4);
assert(cell16.vertices.length === 8, '16-Cell has exactly 8 vertices');
assert(cell16.edges.length === 24, '16-Cell has exactly 24 cross-polytope edges');

// 24-Cell (Octaplex): 24 vertices, 96 edges (Unique to 4D!)
const cell24 = generate24Cell(1.2);
assert(cell24.vertices.length === 24, '24-Cell has exactly 24 vertices in 4-space');
assert(cell24.edges.length === 96, '24-Cell has exactly 96 edges');

// Clifford Torus: Parameterized 4D donut
const torus4D = generateCliffordTorus(8, 8, 1.2);
assert(torus4D.vertices.length === 64, 'Clifford Torus generates 64 parameter grid vertices');
assert(torus4D.edges.length === 128, 'Clifford Torus generates 128 closed surface edges');

// 4. Store State Management
const hStore = useHyper4DStore.getState();
hStore.reset4D();

assert(useHyper4DStore.getState().isOpen === false, 'Hyper4D observatory initially closed');
hStore.open4D();
assert(useHyper4DStore.getState().isOpen === true, 'Observatory opens via action');

hStore.setPolytope('24cell');
assert(useHyper4DStore.getState().activePolytope === '24cell', 'Switches active polytope to 24-Cell');

hStore.setSpeedXW(1.4);
assert(useHyper4DStore.getState().speedXW === 1.4, 'Speed XW updated accurately');

hStore.setColorTheme('dark_matter');
assert(useHyper4DStore.getState().colorTheme === 'dark_matter', 'Energy theme switched to dark_matter');

// Avatar Crown Toggle
assert(useHyper4DStore.getState().isEquippedOnPlayer === true, '4D crown equipped by default');
hStore.toggleEquipAura();
assert(useHyper4DStore.getState().isEquippedOnPlayer === false, 'Toggles 4D crown off');
hStore.toggleEquipAura();
assert(useHyper4DStore.getState().isEquippedOnPlayer === true, 'Toggles 4D crown back on');

// 5. Cash Cannon Spray Trigger
const initialCash = useEconomyStore.getState().walletBalance;
hStore.triggerCashCannon();
assert(useHyper4DStore.getState().isCashCannonActive === true, 'Cash cannon activates physical spraying burst');
assert(useEconomyStore.getState().walletBalance === initialCash - 1000, 'Cash cannon decrements ₦1,000 spray cash');

console.log(`\n4D Hyper-Dimensional Logic Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
