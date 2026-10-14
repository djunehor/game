import { useEffect, useState } from 'react';
import { useLifeStore } from '../life/lifeStore';
import { LIFE_TRAITS } from '../life/content';
import { AVATAR_EMOJIS, ACCENT_COLORS, SKIN_TONES } from '../data/profileOptions';

// ---------------------------------------------------------------------------
// Household menu: rename the family, move Sims in and out, start over, and a
// reminder of the controls.
// ---------------------------------------------------------------------------

const HELP_KEY = 'life-sim-seen-help-v1';

const FIRST_NAMES = ['Ada', 'Chidi', 'Tunde', 'Amara', 'Zainab', 'Emeka', 'Ngozi', 'Femi', 'Yemi', 'Kemi', 'Sade', 'Ife'];
const LAST_NAMES = ['Okafor', 'Adeyemi', 'Balogun', 'Nwosu', 'Bello', 'Eze', 'Ogun', 'Musa'];

const CONTROLS: [string, string][] = [
  ['W A S D / arrows', 'Walk the selected Sim'],
  ['Click a Sim', 'Select them · click another to visit'],
  ['Click an object', 'Choose what to do with it'],
  ['Mouse wheel', 'Zoom in and out'],
  ['Q / E', 'Orbit the camera'],
  ['Space', 'Pause · press again to resume'],
  ['1 / 2 / 3', 'Normal, fast, ultra speed'],
  ['V', 'Toggle close-up camera'],
];

export function HouseholdMenu({ onOpenChange }: { onOpenChange?: (open: boolean) => void } = {}) {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpOnStart, setHelpOnStart] = useState(false);

  const household = useLifeStore((s) => s.household);
  const selectedSimId = useLifeStore((s) => s.selectedSimId);
  const selectSim = useLifeStore((s) => s.selectSim);
  const removeSim = useLifeStore((s) => s.removeSim);
  const reset = useLifeStore((s) => s.reset);

  // First run: show the controls unprompted, once.
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(HELP_KEY)) return;
    setHelpOnStart(true);
    localStorage.setItem(HELP_KEY, '1');
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  if (!household) return null;

  const addRandomSim = () => {
    const seed = household.sims.length + household.name.length;
    const traitPool = LIFE_TRAITS.map((t) => t.id).filter(
      (id) => !household.sims.some((s) => s.traits.includes(id)),
    );
    useLifeStore.getState().addSim({
      firstName: FIRST_NAMES[seed % FIRST_NAMES.length],
      lastName: LAST_NAMES[seed % LAST_NAMES.length],
      gender: seed % 2 === 0 ? 'F' : 'M',
      stage: 'youngAdult',
      traits: traitPool.slice(0, 2),
      aspiration: 'popularity',
      avatar: AVATAR_EMOJIS[seed % AVATAR_EMOJIS.length],
      accentColor: ACCENT_COLORS[seed % ACCENT_COLORS.length],
      skinTone: SKIN_TONES[seed % SKIN_TONES.length],
      career: null,
    });
  };

  const startOver = () => {
    if (typeof window !== 'undefined' && !window.confirm('Start a new household? The current family will be gone.')) {
      return;
    }
    reset();
  };

  const helpVisible = showHelp || helpOnStart;

  return (
    <>
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Household menu"
          className="grid size-9 place-items-center rounded-2xl border border-white/20 bg-slate-950/85 text-sm font-bold text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900 cursor-pointer"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="absolute right-3 top-14 z-40 w-64 rounded-2xl border border-white/15 bg-slate-950/95 p-2 text-white shadow-2xl backdrop-blur-xl">
          <label className="block px-1.5 pt-1">
            <span className="text-[9px] font-bold uppercase tracking-wide text-white/40">Household name</span>
            <input
              value={household.name}
              onChange={(e) => useLifeStore.setState((s) => ({
                household: s.household ? { ...s.household, name: e.target.value } : s.household,
              }))}
              className="mt-0.5 w-full rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-[12px] font-semibold outline-none focus:border-gold"
            />
          </label>

          <div className="mt-2 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white/40">
            Members ({household.sims.length})
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {household.sims.map((sim) => (
              <div key={sim.id} className="flex items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-white/5">
                <button
                  type="button"
                  onClick={() => {
                    selectSim(sim.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-semibold cursor-pointer"
                >
                  <span>{sim.avatar}</span>
                  <span className={`truncate ${sim.id === selectedSimId ? 'text-gold' : ''}`}>
                    {sim.firstName} {sim.lastName}
                  </span>
                </button>
                {household.sims.length > 1 && (
                  <button
                    type="button"
                    title={`Move ${sim.firstName} out`}
                    onClick={() => removeSim(sim.id)}
                    className="rounded px-1 text-[10px] text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                  >
                    Move out
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="my-1.5 h-px bg-white/10" />

          <button
            type="button"
            disabled={household.sims.length >= 8}
            onClick={addRandomSim}
            className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
              household.sims.length >= 8
                ? 'cursor-not-allowed text-white/30'
                : 'cursor-pointer hover:bg-white/10'
            }`}
          >
            <span>➕</span>
            <span>{household.sims.length >= 8 ? 'House is full' : 'Move someone in'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition hover:bg-white/10 cursor-pointer"
          >
            <span>❓</span>
            <span>Controls</span>
          </button>
          <button
            type="button"
            onClick={startOver}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20 cursor-pointer"
          >
            <span>🏚️</span>
            <span>Start a new household</span>
          </button>
        </div>
      )}

      {helpVisible && (
        <div className="absolute left-1/2 top-16 z-40 w-[22rem] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gold">How to live here</span>
            <button
              type="button"
              onClick={() => {
                setShowHelp(false);
                setHelpOnStart(false);
              }}
              className="rounded px-1.5 text-[11px] text-white/60 hover:bg-white/10 cursor-pointer"
            >
              Got it
            </button>
          </div>
          <p className="mt-1 text-[10px] text-white/55">
            Your Sims look after themselves — you decide when to step in. Needs drain over
            time, so keep an eye on the bars.
          </p>
          <div className="mt-2 grid grid-cols-1 gap-1">
            {CONTROLS.map(([key, meaning]) => (
              <div key={key} className="flex items-baseline justify-between gap-3 text-[10px]">
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono font-bold text-white/80">
                  {key}
                </span>
                <span className="flex-1 text-right text-white/60">{meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
