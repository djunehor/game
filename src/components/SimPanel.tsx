import { useMemo, useState } from 'react';
import { INTERACTIONS, interactionsInRoom } from '../sim/interactions';
import { MOTIVE_META, motiveColor } from '../sim/motives';
import { allMoodlets, computeMood } from '../sim/moodlets';
import { allSkillProgress, getSkillLevel, meetsSkillRequirement } from '../sim/skills';
import { SPEED_META, clockParts } from '../sim/time';
import { MOTIVE_IDS, type InteractionDef, type MotiveId, type SimAvatar, type SimClock, type SimSpeed } from '../sim/types';
import type { SimEvent } from '../sim/simStore';

type Tab = 'needs' | 'skills' | 'actions';

// ---------------------------------------------------------------------------
// Presentational view — pure props in, markup out. Keeping the store reads out
// of this component is what makes it testable under renderToString.
// ---------------------------------------------------------------------------
export interface SimPanelViewProps {
  avatar: SimAvatar;
  clock: SimClock;
  speed: SimSpeed;
  autonomyEnabled: boolean;
  events: SimEvent[];
  week: number;
  room: string;
  defaultOpen?: boolean;
  defaultTab?: Tab;
  onSetSpeed: (speed: SimSpeed) => void;
  onToggleAutonomy: () => void;
  onOrder: (interactionId: string) => void;
  /** Explicit action list (life mode shows everything on the lot). */
  availableActions?: InteractionDef[];
  /** Section labels keyed by interaction room (life mode groups by room name). */
  roomLabels?: Record<string, string>;
  /** Hide the speed controls when the host UI renders its own. */
  showSpeedControls?: boolean;
  onCancel: () => void;
  onClearQueue: () => void;
}

function MotiveBar({ id, value }: { id: MotiveId; value: number }) {
  const meta = MOTIVE_META[id];
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 text-center text-sm" title={meta.label}>
        {meta.emoji}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: motiveColor(value) }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-[10px] font-bold tabular-nums text-white/60">
        {Math.round(value)}
      </span>
    </div>
  );
}

export function SimPanelView({
  avatar,
  clock,
  speed,
  autonomyEnabled,
  events,
  week,
  room,
  defaultOpen = false,
  defaultTab = 'needs',
  onSetSpeed,
  onToggleAutonomy,
  onOrder,
  onCancel,
  onClearQueue,
  availableActions,
  roomLabels,
  showSpeedControls = true,
}: SimPanelViewProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<Tab>(defaultTab);

  const parts = clockParts(clock);
  const mood = useMemo(() => computeMood(avatar, clock.totalMinutes), [avatar, clock.totalMinutes]);
  const moodlets = useMemo(() => allMoodlets(avatar, clock.totalMinutes), [avatar, clock.totalMinutes]);
  const skills = useMemo(() => allSkillProgress(avatar.skills), [avatar]);

  const activeDef = avatar.active ? INTERACTIONS.find((i) => i.id === avatar.active!.defId) : null;
  const progress = avatar.active
    ? Math.min(100, Math.round((avatar.active.elapsed / avatar.active.duration) * 100))
    : 0;

  const roomActions = useMemo(
    () => availableActions ?? interactionsInRoom(room),
    [availableActions, room],
  );
  const groupedActions = useMemo(() => {
    if (!availableActions) return null;
    const groups = new Map<string, InteractionDef[]>();
    for (const def of availableActions) {
      const list = groups.get(def.room) ?? [];
      list.push(def);
      groups.set(def.room, list);
    }
    return [...groups.entries()];
  }, [availableActions]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute bottom-16 left-3 z-30 flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-slate-900 active:scale-95 cursor-pointer"
        aria-label="Toggle life simulation panel"
      >
        <span className="text-base">{mood.emoji}</span>
        <span className="text-sm">{mood.label}</span>
      </button>

      {open && (
        <div className="absolute bottom-28 left-3 z-30 flex w-[19rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/92 text-white shadow-2xl backdrop-blur-xl">
          {/* Clock + speed */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold/80">
                {`${parts.dayName} \u00b7 Week ${week}`}
              </span>
              <span className="font-display text-lg font-semibold tabular-nums">{parts.time}</span>
            </div>
            <div className="flex items-center gap-1">
              {showSpeedControls && SPEED_META.map((s) => (
                <button
                  key={s.speed}
                  type="button"
                  onClick={() => onSetSpeed(s.speed)}
                  title={s.label}
                  aria-label={s.label}
                  className={`grid size-7 place-items-center rounded-lg text-xs transition cursor-pointer ${
                    speed === s.speed
                      ? 'bg-gold/25 text-gold ring-1 ring-gold/60'
                      : 'bg-white/5 text-white/60 hover:bg-white/15'
                  }`}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5">
            <span className="text-2xl">{mood.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold">{mood.label}</span>
                <span className="text-[10px] font-semibold text-white/50">{mood.grade}/100</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${mood.grade}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex shrink-0 border-b border-white/10 text-[11px] font-bold">
            {(['needs', 'skills', 'actions'] as Tab[]).map((t) => (
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

          <div className="max-h-[46vh] overflow-y-auto px-3 py-2.5">
            {tab === 'needs' && (
              <div className="space-y-2">
                {MOTIVE_IDS.map((id) => (
                  <MotiveBar key={id} id={id} value={avatar.motives[id]} />
                ))}
                {moodlets.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-2.5">
                    {moodlets.map((m) => (
                      <span
                        key={m.id}
                        title={`${m.label} (${m.intensity > 0 ? '+' : ''}${m.intensity})`}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          m.intensity >= 0 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'skills' && (
              <div className="space-y-2">
                {skills.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="w-5 text-center text-sm">{s.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-semibold text-white/80">{s.label}</span>
                        <span className="text-[10px] font-bold text-gold">
                          {s.maxed ? 'MAX' : `Lv ${s.level}`}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-sky-400" style={{ width: `${s.ratio * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'actions' && (
              <div className="space-y-2">
                {activeDef && (
                  <div className="rounded-xl border border-gold/30 bg-gold/10 p-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>
                        {activeDef.emoji} {activeDef.label}
                      </span>
                      <button
                        type="button"
                        onClick={onCancel}
                        className="rounded px-1.5 py-0.5 text-[10px] text-white/60 hover:bg-white/10 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/40">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {avatar.queue.length > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-2 py-1.5 text-[10px] text-white/70">
                    <span>
                      Queued:{' '}
                      {avatar.queue.map((id) => INTERACTIONS.find((i) => i.id === id)?.emoji ?? '?').join(' ')}
                    </span>
                    <button
                      type="button"
                      onClick={onClearQueue}
                      className="rounded px-1.5 py-0.5 hover:bg-white/10 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {!groupedActions && (
                  <div className="pt-1 text-[10px] font-bold uppercase tracking-wide text-white/40">
                    {`In ${room}`}
                  </div>
                )}
                {(groupedActions ?? [[room, roomActions]] as [string, InteractionDef[]][]).map(([groupRoom, defs]) => (
                  <div key={groupRoom} className="space-y-1.5">
                    {groupedActions && (
                      <div className="pt-1 text-[10px] font-bold uppercase tracking-wide text-white/40">
                        {roomLabels?.[groupRoom] ?? groupRoom}
                      </div>
                    )}
                    {defs.map((def) => {
                  const locked = !meetsSkillRequirement(avatar.skills, def.requiresSkill);
                  const level = def.requiresSkill ? getSkillLevel(avatar.skills, def.requiresSkill.id) : 0;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      disabled={locked}
                      onClick={() => onOrder(def.id)}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] transition ${
                        locked ? 'cursor-not-allowed bg-white/5 text-white/30' : 'cursor-pointer bg-white/5 hover:bg-white/15'
                      }`}
                    >
                      <span className="text-sm">{def.emoji}</span>
                      <span className="flex-1 font-semibold">{def.label}</span>
                      <span className="text-[10px] text-white/40">{`${def.minutes}m`}</span>
                      {locked && def.requiresSkill && (
                        <span className="text-[10px] text-amber-400/80">
                          {`Lv ${level}/${def.requiresSkill.level}`}
                        </span>
                      )}
                    </button>
                    );
                  })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: autonomy + feed */}
          <div className="shrink-0 border-t border-white/10 px-3 py-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
              <span>Free Will</span>
              <button
                type="button"
                onClick={onToggleAutonomy}
                role="switch"
                aria-checked={autonomyEnabled}
                aria-label="Toggle free will"
                className={`h-5 w-9 shrink-0 rounded-full transition cursor-pointer ${
                  autonomyEnabled ? 'bg-emerald-500/70' : 'bg-white/15'
                }`}
              >
                <span
                  className={`block size-4 rounded-full bg-white transition-transform ${
                    autonomyEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {events[0] && (
              <div className="mt-1.5 truncate text-[10px] text-white/45" title={events[0].text}>
                {events[0].emoji} {events[0].text}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
