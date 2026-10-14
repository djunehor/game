import { useState } from 'react';
import { ASPIRATIONS, LIFE_STAGES, LIFE_TRAITS, MAX_TRAITS, STAGE_ORDER } from '../life/content';
import { useLifeStore, type NewSimConfig } from '../life/lifeStore';
import { AVATAR_EMOJIS, ACCENT_COLORS, SKIN_TONES } from '../data/profileOptions';
import { CAREER_LIST } from '../life/content';
import type { LifeStage } from '../life/types';
import type { CareerId } from '../life/types';

// ---------------------------------------------------------------------------
// Create-a-Household (CAS): name the family, then build each Sim.
// ---------------------------------------------------------------------------

const FIRST_NAMES = ['Ada', 'Chidi', 'Tunde', 'Amara', 'Zainab', 'Emeka', 'Ngozi', 'Femi', 'Yemi', 'Kemi'];
const LAST_NAMES = ['Okafor', 'Adeyemi', 'Balogun', 'Nwosu', 'Bello', 'Eze', 'Ogun', 'Musa'];

let tempCounter = 0;
const tempId = () => `tmp-${tempCounter++}`;

interface DraftSim extends NewSimConfig {
  key: string;
}

function defaultDraft(stage: LifeStage = 'youngAdult'): DraftSim {
  tempCounter++;
  return {
    key: tempId(),
    firstName: FIRST_NAMES[tempCounter % FIRST_NAMES.length],
    lastName: LAST_NAMES[tempCounter % LAST_NAMES.length],
    gender: tempCounter % 2 === 0 ? 'F' : 'M',
    stage,
    traits: ['cheerful'],
    aspiration: 'popularity',
    avatar: AVATAR_EMOJIS[tempCounter % AVATAR_EMOJIS.length],
    accentColor: ACCENT_COLORS[tempCounter % ACCENT_COLORS.length],
    skinTone: SKIN_TONES[tempCounter % SKIN_TONES.length],
    hairstyle: 'afro',
    career: stage === 'adult' || stage === 'youngAdult' ? 'tech' : null,
  };
}

export function CreateHousehold() {
  const createHousehold = useLifeStore((s) => s.createHousehold);
  const [householdName, setHouseholdName] = useState('The Okafor Family');
  const [drafts, setDrafts] = useState<DraftSim[]>([defaultDraft()]);

  const update = (key: string, patch: Partial<DraftSim>) =>
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const toggleTrait = (key: string, traitId: string) => {
    setDrafts((list) =>
      list.map((d) => {
        if (d.key !== key) return d;
        if (d.traits.includes(traitId)) return { ...d, traits: d.traits.filter((t) => t !== traitId) };
        if (d.traits.length >= MAX_TRAITS) return d;
        return { ...d, traits: [...d.traits, traitId] };
      }),
    );
  };

  const canStart = drafts.length > 0 && drafts.every((d) => d.firstName.trim() && d.traits.length > 0);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-b from-slate-950 via-ink to-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold/80">Create a Household</p>
          <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">Who&apos;s moving in?</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
            Build a family, give them personalities and dreams, then move them into the house.
            They&apos;ll live their own lives — you decide when to step in.
          </p>
        </div>

        <label className="mt-8 block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">Household name</span>
          <input
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold outline-none focus:border-gold"
          />
        </label>

        <div className="mt-6 space-y-4">
          {drafts.map((sim, index) => (
            <div key={sim.key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gold">
                  {sim.avatar} Sim {index + 1}
                </span>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDrafts((list) => list.filter((d) => d.key !== sim.key))}
                    className="rounded-xl bg-rose-500/15 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Names + gender */}
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  value={sim.firstName}
                  onChange={(e) => update(sim.key, { firstName: e.target.value })}
                  placeholder="First name"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <input
                  value={sim.lastName}
                  onChange={(e) => update(sim.key, { lastName: e.target.value })}
                  placeholder="Last name"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <div className="flex gap-1.5">
                  {(['F', 'M'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update(sim.key, { gender: g })}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition cursor-pointer ${
                        sim.gender === g ? 'bg-gold/25 text-gold ring-1 ring-gold/50' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {g === 'F' ? '♀ Female' : '♂ Male'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Life stage */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">Life stage</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {STAGE_ORDER.filter((s) => s !== 'baby').map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => update(sim.key, { stage })}
                      className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        sim.stage === stage ? 'bg-gold/25 text-gold ring-1 ring-gold/50' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {LIFE_STAGES[stage].emoji} {LIFE_STAGES[stage].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Traits */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                  Traits ({sim.traits.length}/{MAX_TRAITS})
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {LIFE_TRAITS.map((trait) => {
                    const on = sim.traits.includes(trait.id);
                    return (
                      <button
                        key={trait.id}
                        type="button"
                        onClick={() => toggleTrait(sim.key, trait.id)}
                        title={trait.description}
                        className={`rounded-xl px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                          on ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50' : 'bg-white/5 text-white/55 hover:bg-white/10'
                        }`}
                      >
                        {trait.emoji} {trait.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspiration */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">Aspiration</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {Object.values(ASPIRATIONS).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => update(sim.key, { aspiration: a.id })}
                      title={a.description}
                      className={`rounded-xl px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        sim.aspiration === a.id ? 'bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50' : 'bg-white/5 text-white/55 hover:bg-white/10'
                      }`}
                    >
                      {a.emoji} {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career */}
              {LIFE_STAGES[sim.stage].canWork && (
                <div className="mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">Career</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CAREER_LIST.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => update(sim.key, { career: c.id as CareerId })}
                        className={`rounded-xl px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                          sim.career === c.id ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/50' : 'bg-white/5 text-white/55 hover:bg-white/10'
                        }`}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Look */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Face</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {AVATAR_EMOJIS.slice(0, 10).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => update(sim.key, { avatar: e })}
                        className={`grid size-8 place-items-center rounded-lg text-base transition cursor-pointer ${
                          sim.avatar === e ? 'bg-gold/25 ring-1 ring-gold/60' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Outfit</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update(sim.key, { accentColor: c })}
                        style={{ backgroundColor: c }}
                        className={`size-8 rounded-lg transition cursor-pointer ${
                          sim.accentColor === c ? 'ring-2 ring-gold' : 'ring-1 ring-white/20'
                        }`}
                        aria-label={`Outfit colour ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Skin</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {SKIN_TONES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update(sim.key, { skinTone: c })}
                        style={{ backgroundColor: c }}
                        className={`size-8 rounded-lg transition cursor-pointer ${
                          sim.skinTone === c ? 'ring-2 ring-gold' : 'ring-1 ring-white/20'
                        }`}
                        aria-label={`Skin tone ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {drafts.length < 6 && (
            <button
              type="button"
              onClick={() => setDrafts((list) => [...list, defaultDraft()])}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 cursor-pointer"
            >
              ➕ Add a Sim
            </button>
          )}
          <button
            type="button"
            disabled={!canStart}
            onClick={() =>
              createHousehold({
                name: householdName.trim() || 'The Household',
                sims: drafts.map(({ key, ...rest }) => ({ ...rest, key } as NewSimConfig)),
              })
            }
            className={`flex-1 rounded-2xl py-3 text-base font-bold transition ${
              canStart ? 'bg-bbn text-white shadow-lg shadow-bbn/30 hover:bg-bbn-deep cursor-pointer' : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
          >
            Move In 🏡
          </button>
        </div>
      </div>
    </div>
  );
}
