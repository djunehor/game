import { useMemo, useState } from 'react';
import { useLifeStore } from '../life/lifeStore';
import { useSimStore } from '../sim/simStore';
import { computeMood } from '../sim/moodlets';
import { friendshipLabel, relationKindFor } from '../life/aging';
import { LIFE_STAGES } from '../life/content';
import { SKILL_META } from '../sim/skills';
import { allSkillProgress } from '../sim/skills';

// ---------------------------------------------------------------------------
// Who everybody is to each other: standings, family links, and a way to start
// a conversation without hunting for the Sim in the world.
// ---------------------------------------------------------------------------

const KIND_LABEL: Record<string, string> = {
  stranger: 'Stranger',
  acquaintance: 'Acquaintance',
  friend: 'Friend',
  bestFriend: 'Best friend',
  enemy: 'Enemy',
  crush: 'Crush',
  partner: 'Partner',
  spouse: 'Spouse',
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
};

const FAMILY_KINDS = new Set(['parent', 'child', 'sibling', 'spouse']);

function Meter({ value, colour }: { value: number; colour: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: colour }}
      />
    </div>
  );
}

export function RelationshipsPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'people' | 'skills'>('people');

  const household = useLifeStore((s) => s.household);
  const selectedSimId = useLifeStore((s) => s.selectedSimId);
  const selectSim = useLifeStore((s) => s.selectSim);
  const setSocialTarget = useLifeStore((s) => s.setSocialTarget);
  const avatars = useSimStore((s) => s.avatars);
  const clock = useSimStore((s) => s.clock);

  const selected = household?.sims.find((s) => s.id === selectedSimId) ?? household?.sims[0];

  const rows = useMemo(() => {
    if (!household || !selected) return [];
    return household.sims
      .filter((m) => m.id !== selected.id)
      .map((member) => {
        const forward = selected.relationships[member.id] ?? {
          friendship: 0,
          romance: 0,
          kind: 'stranger' as const,
        };
        const back = member.relationships[selected.id];
        return { member, forward, mutual: back ? back.friendship === forward.friendship : false };
      })
      .sort((a, b) => b.forward.friendship - a.forward.friendship);
  }, [household, selected]);

  const skills = useMemo(
    () => (selected ? allSkillProgress(avatars[selected.id]?.skills ?? {}) : []),
    [selected, avatars],
  );

  if (!household || !selected) return null;

  const mood = avatars[selected.id]
    ? computeMood(avatars[selected.id], clock.totalMinutes)
    : null;
  const family = rows.filter((r) => FAMILY_KINDS.has(r.forward.kind));
  const children = household.sims.filter((m) => m.parentIds?.includes(selected.id));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Family and friends"
        className="absolute bottom-16 left-40 z-30 flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-slate-900 cursor-pointer"
      >
        <span className="text-base">👥</span>
        <span>{open ? 'Close' : 'Relationships'}</span>
      </button>

      {open && (
        <div className="absolute bottom-28 left-40 z-30 flex max-h-[60vh] w-[21rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/94 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="text-xl">{selected.avatar}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-bold">
                {selected.firstName} {selected.lastName}
              </div>
              <div className="text-[9px] text-white/50">
                {LIFE_STAGES[selected.stage].emoji} {LIFE_STAGES[selected.stage].label}
                {mood ? ` · ${mood.emoji} ${mood.label}` : ''}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 border-b border-white/10 text-[11px] font-bold">
            {(['people', 'skills'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-2 capitalize transition cursor-pointer ${
                  tab === t ? 'bg-white/10 text-gold' : 'text-white/50 hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto px-3 py-2.5">
            {tab === 'people' && (
              <>
                {(family.length > 0 || children.length > 0) && (
                  <div className="mb-2 flex flex-wrap gap-1 border-b border-white/10 pb-2">
                    {family.map((r) => (
                      <span
                        key={r.member.id}
                        className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                      >
                        {KIND_LABEL[r.forward.kind] ?? r.forward.kind}: {r.member.firstName}
                      </span>
                    ))}
                    {children.map((child) => (
                      <span
                        key={child.id}
                        className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                      >
                        Child: {child.firstName}
                      </span>
                    ))}
                  </div>
                )}

                {rows.length === 0 && (
                  <p className="text-[11px] text-white/50">
                    Nobody else lives here yet. Move someone in from the ☰ menu.
                  </p>
                )}

                <div className="space-y-2">
                  {rows.map(({ member, forward }) => (
                    <div key={member.id} className="rounded-xl bg-white/5 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{member.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-bold">
                            {member.firstName}
                            {member.visiting && (
                              <span className="ml-1 rounded bg-sky-500/20 px-1 text-[8px] font-bold text-sky-200">
                                visiting
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-white/50">
                            {friendshipLabel(forward.friendship)} ·{' '}
                            {KIND_LABEL[relationKindFor(forward)] ?? forward.kind}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSocialTarget(member.id);
                            setOpen(false);
                          }}
                          className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold transition hover:bg-white/20 cursor-pointer"
                        >
                          Talk
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            selectSim(member.id);
                            setOpen(false);
                          }}
                          className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold transition hover:bg-white/20 cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        <Meter value={(forward.friendship + 100) / 2} colour="#38bdf8" />
                        {forward.romance > 0 && <Meter value={forward.romance} colour="#f472b6" />}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'skills' && (
              <div className="space-y-2">
                {skills.map((entry) => (
                  <div key={entry.id} title={SKILL_META[entry.id].description}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold text-white/80">
                        {entry.emoji} {entry.label}
                      </span>
                      <span className="text-[10px] font-bold text-gold">
                        {entry.maxed ? 'MAX' : `Lv ${entry.level}`}
                      </span>
                    </div>
                    <div className="mt-0.5">
                      <Meter value={entry.ratio * 100} colour="#7dd3fc" />
                    </div>
                    <div className="mt-0.5 text-[9px] text-white/40">
                      {SKILL_META[entry.id].description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
