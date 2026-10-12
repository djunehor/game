import { Canvas } from '@react-three/fiber';
import {
  useHyper4DStore,
  type PolytopeType,
  type HyperColorTheme,
} from '../world/hyper4DStore';
import { HyperTesseract3D } from '../three/HyperTesseract3D';

export function Hyper4DModal() {
  const store = useHyper4DStore();
  const state = useHyper4DStore.getState();

  const isOpen = store.isOpen || state.isOpen;
  const activePolytope = state.activePolytope || store.activePolytope;
  const speedXW = typeof state.speedXW === 'number' ? state.speedXW : store.speedXW;
  const speedYW = typeof state.speedYW === 'number' ? state.speedYW : store.speedYW;
  const speedZW = typeof state.speedZW === 'number' ? state.speedZW : store.speedZW;
  const cameraDistance4D =
    typeof state.cameraDistance4D === 'number'
      ? state.cameraDistance4D
      : store.cameraDistance4D;
  const colorTheme = state.colorTheme || store.colorTheme;
  const isEquippedOnPlayer = store.isEquippedOnPlayer || state.isEquippedOnPlayer;

  const close4D = useHyper4DStore((s) => s.close4D);
  const setPolytope = useHyper4DStore((s) => s.setPolytope);
  const setSpeedXW = useHyper4DStore((s) => s.setSpeedXW);
  const setSpeedYW = useHyper4DStore((s) => s.setSpeedYW);
  const setSpeedZW = useHyper4DStore((s) => s.setSpeedZW);
  const setCameraDistance4D = useHyper4DStore((s) => s.setCameraDistance4D);
  const setColorTheme = useHyper4DStore((s) => s.setColorTheme);
  const toggleEquipAura = useHyper4DStore((s) => s.toggleEquipAura);
  const triggerCashCannon = useHyper4DStore((s) => s.triggerCashCannon);

  if (!isOpen) return null;

  const POLYTOPES: { id: PolytopeType; name: string; emoji: string; desc: string; stats: string }[] = [
    {
      id: 'tesseract',
      name: 'Tesseract',
      emoji: '🧊',
      desc: '8-Cell Hypercube with 16 vertices & 32 edges',
      stats: '16 Vertices · 32 Edges · 24 Squares',
    },
    {
      id: '16cell',
      name: '16-Cell',
      emoji: '💠',
      desc: 'Hyperoctahedron (4D cross-polytope)',
      stats: '8 Vertices · 24 Edges · 32 Triangles',
    },
    {
      id: '24cell',
      name: '24-Cell',
      emoji: '🔮',
      desc: 'Octaplex with unique 4D-only regular symmetry',
      stats: '24 Vertices · 96 Edges · 24 Octahedra',
    },
    {
      id: 'clifford_torus',
      name: 'Clifford Torus',
      emoji: '🍩',
      desc: 'Flat 4-dimensional donut embedded in 3-sphere',
      stats: '100 Grid Vertices · 200 Surface Edges',
    },
  ];

  const THEMES: { id: HyperColorTheme; name: string; emoji: string }[] = [
    { id: 'neon_cyan', name: 'Cyber Cyan', emoji: '💎' },
    { id: 'imperial_gold', name: 'Imperial Gold', emoji: '👑' },
    { id: 'dark_matter', name: 'Dark Matter', emoji: '🌌' },
    { id: 'matrix_emerald', name: 'Matrix Emerald', emoji: '🟢' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[840px] rounded-3xl border border-cyan-500/30 bg-slate-950/95 text-white shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 rounded-2xl bg-cyan-500/10 text-cyan-400">🌌</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">4D Hyper-Space Observatory</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Real-time 4D Projection
                </span>
              </div>
              <p className="text-xs text-slate-400">
                True hyper-dimensional spatial rotation across the XW, YW, and ZW coordinate planes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close4D}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close 4D Observatory"
          >
            ✕
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Live 4D Projected Canvas (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 border-b lg:border-b-0 lg:border-r border-white/10 relative">
            <div className="relative flex-1 w-full min-h-[300px] overflow-hidden bg-radial from-slate-900 to-black">
              <Canvas camera={{ position: [0, 0, 3.8], fov: 50 }}>
                <ambientLight intensity={1.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <HyperTesseract3D scale={1.2} />
              </Canvas>

              {/* Real-time Math HUD Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none select-none">
                <div className="px-3 py-1.5 rounded-xl bg-black/75 border border-white/15 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Active 4D Polytope
                  </span>
                  <span className="text-xs font-black text-cyan-300">
                    {POLYTOPES.find((p) => p.id === activePolytope)?.stats}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-black/75 border border-white/15 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Projection Formula
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    P_3D = P_4D / (d - W)
                  </span>
                </div>
              </div>

              {/* Live Rotation Speed Indicator */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none select-none">
                <div className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
                  XW: {(speedXW * 60).toFixed(0)}°/s · YW: {(speedYW * 60).toFixed(0)}°/s · ZW: {(speedZW * 60).toFixed(0)}°/s
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hyper-Dimensional Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto bg-slate-900/40">
            <div className="flex flex-col gap-5">
              {/* 1. Polytope Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  1. Select 4D Geometric Polytope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POLYTOPES.map((poly) => {
                    const isSelected = poly.id === activePolytope;
                    return (
                      <button
                        key={poly.id}
                        type="button"
                        onClick={() => setPolytope(poly.id)}
                        className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/20 text-white shadow-lg ring-1 ring-cyan-400'
                            : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xl">{poly.emoji}</span>
                          <span className="text-xs font-extrabold">{poly.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{poly.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Hyper-Plane Rotation Sliders */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  2. Hyper-Dimensional Rotation Speeds
                </label>
                <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-white/10">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-300">XW Plane (Hyper-Roll)</span>
                      <span className="text-cyan-400 font-mono">{speedXW.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={speedXW}
                      onChange={(e) => setSpeedXW(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-300">YW Plane (Hyper-Pitch)</span>
                      <span className="text-cyan-400 font-mono">{speedYW.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={speedYW}
                      onChange={(e) => setSpeedYW(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-300">ZW Plane (Hyper-Yaw)</span>
                      <span className="text-cyan-400 font-mono">{speedZW.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={speedZW}
                      onChange={(e) => setSpeedZW(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-300">4D Perspective Distance (d)</span>
                      <span className="text-amber-400 font-mono">{cameraDistance4D.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="1.4"
                      max="4.0"
                      step="0.1"
                      value={cameraDistance4D}
                      onChange={(e) => setCameraDistance4D(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Energy Color Theme */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  3. Quantum Energy Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((th) => {
                    const isSelected = th.id === colorTheme;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setColorTheme(th.id)}
                        className={`flex flex-col items-center p-2 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-white bg-white/20 text-white shadow ring-1 ring-white/50'
                            : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-base mb-0.5">{th.emoji}</span>
                        <span className="text-[10px] font-bold truncate max-w-full">{th.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions: Equip 4D Crown & Spray Cash */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-white/10 mt-5">
              <button
                type="button"
                onClick={toggleEquipAura}
                className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xl cursor-pointer ${
                  isEquippedOnPlayer
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                }`}
              >
                {isEquippedOnPlayer
                  ? '👑 4D Hyper-Crown Equipped on Avatar (Active)'
                  : '✨ Equip 4D Hyper-Crown on Avatar'}
              </button>

              <button
                type="button"
                onClick={triggerCashCannon}
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black transition-all shadow-xl active:scale-98 cursor-pointer"
              >
                💸 Fire Cash Cannon (Spray ₦1,000 Notes with Physics)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
