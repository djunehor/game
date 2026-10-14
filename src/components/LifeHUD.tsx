import { useMemo } from 'react';
import { SimPanelView } from './SimPanel';
import { useSimStore } from '../sim/simStore';
import { clockParts } from '../sim/time';
import { allInteractions } from '../sim/interactions';
import { LIFE_ROOM_LABELS } from '../life/catalog';
import { useLifeStore } from '../life/lifeStore';
import { lotValue } from '../life/objects';
import { allSocialInteractions } from '../sim/interactions';
import { CAREERS } from '../life/content';
import { levelTitle, shiftFor } from '../life/careers';
import { canUseInteraction, friendshipLabel, relationKindFor, stageProgress } from '../life/aging';
import { aspirationStatus, type AspirationContext } from '../life/aspirations';
import { ASPIRATIONS, LIFE_STAGES } from '../life/content';
import { ADOPTION_COST, canAdopt, canTryForBaby } from '../life/family';
import { getSkillLevel } from '../sim/skills';

// ---------------------------------------------------------------------------
// Life-mode HUD: household portraits, money, clock/speed, and the selected
// Sim's needs/skills/actions (reusing the shared simulation panel).
// ---------------------------------------------------------------------------

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

export function LifeHUD() {
  const household = useLifeStore((s) => s.household);
  const mode = useLifeStore((s) => s.mode);
  const setMode = useLifeStore((s) => s.setMode);
  const selectedSimId = useLifeStore((s) => s.selectedSimId);
  const selectSim = useLifeStore((s) => s.selectSim);
  const goToWork = useLifeStore((s) => s.goToWork);
  const wallMode = useLifeStore((s) => s.wallMode);
  const cycleWallMode = useLifeStore((s) => s.cycleWallMode);
  const notifications = useLifeStore((s) => s.notifications);
  const dismiss = useLifeStore((s) => s.dismissNotification);

  const clock = useSimStore((s) => s.clock);
  const speed = useSimStore((s) => s.speed);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const autonomyEnabled = useSimStore((s) => s.autonomyEnabled);
  const setAutonomy = useSimStore((s) => s.setAutonomy);
  const avatars = useSimStore((s) => s.avatars);
  const order = useSimStore((s) => s.order);
  const cancel = useSimStore((s) => s.cancel);
  const clearQueueOf = useSimStore((s) => s.clearQueueOf);
  const events = useSimStore((s) => s.events);

  const parts = clockParts(clock);

  const socialTargetId = useLifeStore((s) => s.socialTargetId);

  /** Every social action the selected Sim could take right now. */
  const socialActions = useMemo(() => {
    if (!household || !selectedSimId) return [];
    const actor = household.sims.find((s) => s.id === selectedSimId);
    if (!actor) return [];
    const skills = avatars[selectedSimId]?.skills ?? {};
    return allSocialInteractions().filter((def) => {
      if (def.stages && !def.stages.includes(actor.stage)) return false;
      if (def.requiresSkill) {
        const level = getSkillLevel(skills, def.requiresSkill.id);
        if (level < def.requiresSkill.level) return false;
      }
      return true;
    });
  }, [household, selectedSimId, avatars]);

  const interactions = useMemo(() => {
    const all = allInteractions().filter((def) => def.id.startsWith('obj:'));
    if (!household) return all;
    const sim = household.sims.find((s) => s.id === selectedSimId);
    if (!sim) return all;
    return all.filter((def) => canUseInteraction(sim, def));
  }, [household, selectedSimId, avatars]);

  if (!household) return null;

  const selected = household.sims.find((s) => s.id === selectedSimId) ?? household.sims[0];
  const selectedAvatar = selected ? avatars[selected.id] : undefined;
  /** The selected Sim's aspiration and how far along they are. */
  const aspiration = useMemo(() => {
    if (!household || !selected) return null;
    const avatar = avatars[selected.id];
    if (!avatar) return null;
    const ctx: AspirationContext = {
      sim: selected,
      skills: avatar.skills,
      career: selected.career,
      counters: avatar.counters ?? {},
      relationships: Object.values(selected.relationships),
      ownedCatalogIds: household.lot.map((o) => o.catalogId),
      lot: household.lot,
    };
    return aspirationStatus(selected.aspiration, ctx);
  }, [household, selected, avatars]);
  const setSocialTarget = useLifeStore((s) => s.setSocialTarget);
  const tryForBaby = useLifeStore((s) => s.tryForBaby);
  const adoptChild = useLifeStore((s) => s.adoptChild);

  const weekday = parts.weekday;
  const shift = selected?.career ? shiftFor(selected.career, weekday) : null;
  const workedToday = useLifeStore.getState().workedToday[selected?.id ?? ''];
  const onShiftNow =
    shift && parts.hour >= shift.startHour && parts.hour < shift.endHour;

  return (
    <>
      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-950/85 to-transparent px-3 pt-3 pb-8 text-white">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950/85 px-3.5 py-1.5 text-sm font-extrabold text-amber-300 shadow-xl backdrop-blur-md">
            ₦{household.funds.toLocaleString()}
          </div>
          <div className="hidden rounded-2xl border border-white/15 bg-slate-950/80 px-3 py-1.5 text-[11px] font-bold text-white/70 backdrop-blur-md sm:block">
            {household.name} · Home value ₦{lotValue(household.lot).toLocaleString()}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gold/80">{parts.dayName}</span>
            <span className="font-display text-base font-semibold tabular-nums">{parts.time}</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { s: 0 as const, e: '⏸️', l: 'Pause' },
              { s: 1 as const, e: '▶️', l: 'Normal' },
              { s: 2 as const, e: '⏩', l: 'Fast' },
              { s: 3 as const, e: '⏭️', l: 'Ultra' },
            ].map(({ s, e, l }) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                aria-label={l}
                className={`grid size-8 place-items-center rounded-xl text-xs transition cursor-pointer ${
                  speed === s ? 'bg-gold/25 text-gold ring-1 ring-gold/60' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={cycleWallMode}
            title="Walls: full / cut away / hidden"
            className="rounded-2xl border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900 cursor-pointer"
          >
            {wallMode === 'up' ? '🧱 Walls Up' : wallMode === 'cut' ? '🧱 Cut Away' : '🧱 Walls Down'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'build' ? 'live' : 'build')}
            className={`rounded-2xl px-3 py-2 text-xs font-bold shadow-xl backdrop-blur-md transition cursor-pointer ${
              mode === 'build'
                ? 'bg-emerald-500/90 text-white'
                : 'border border-white/20 bg-slate-950/85 text-white hover:bg-slate-900'
            }`}
          >
            {mode === 'build' ? '✓ Done' : '🔨 Build'}
          </button>
        </div>
      </header>

      {/* Household portraits */}
      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-end gap-2">
        {household.sims.map((sim) => {
          const avatar = avatars[sim.id];
          const hungry = avatar?.motives.hunger ?? 100;
          const energy = avatar?.motives.energy ?? 100;
          const isSelected = sim.id === selected?.id;
          const careerLabel = sim.career ? levelTitle(sim.career) : null;
          return (
            <button
              key={sim.id}
              type="button"
              onClick={() => selectSim(sim.id)}
              title={`${sim.firstName} ${sim.lastName} · ${LIFE_STAGES[sim.stage].label}`}
              className={`w-24 shrink-0 rounded-2xl border p-1.5 text-left shadow-xl backdrop-blur-md transition cursor-pointer ${
                isSelected
                  ? 'border-gold/70 bg-slate-950/95 ring-1 ring-gold/50'
                  : 'border-white/15 bg-slate-950/80 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{sim.avatar}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold text-white">{sim.firstName}</div>
                  <div className="truncate text-[9px] text-white/50">
                    {sim.pregnantUntilDayOffset !== undefined
                      ? '🤰 expecting'
                      : (careerLabel ?? LIFE_STAGES[sim.stage].label)}
                  </div>
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                <MiniBar value={avatar?.motives.bladder ?? 100} color="#38bdf8" />
                <MiniBar value={hungry} color="#f97316" />
                <MiniBar value={energy} color="#22c55e" />
              </div>
              <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gold/70" style={{ width: `${stageProgress(sim) * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Career / work action for the selected Sim */}
      {selected?.career && (
        <div className="absolute right-3 bottom-28 z-30 w-56 rounded-2xl border border-white/15 bg-slate-950/90 p-2.5 text-white shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-base">{CAREERS[selected.career.id].emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold">{levelTitle(selected.career)}</div>
              <div className="text-[9px] text-white/50">
                Performance {Math.round(selected.career.performance)}%
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={!onShiftNow || Boolean(workedToday)}
            onClick={() => goToWork(selected.id)}
            className={`mt-2 w-full rounded-xl px-2 py-1.5 text-[11px] font-bold transition ${
              onShiftNow && !workedToday
                ? 'cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
          >
            {workedToday ? 'Shift done today' : onShiftNow ? 'Go to Work' : shift ? `Shift at ${shift.startHour}:00` : 'Day off'}
          </button>
        </div>
      )}

      {/* Aspiration tracker */}
      {aspiration && selected && (
        <div className="absolute left-3 bottom-44 z-30 w-60 rounded-2xl border border-white/15 bg-slate-950/92 p-2.5 text-white shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-base">{ASPIRATIONS[aspiration.id].emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-gold">
                {ASPIRATIONS[aspiration.id].label}
              </div>
              <div className="text-[9px] text-white/50">
                {aspiration.fulfilled
                  ? 'Dream fulfilled 🌟'
                  : `${aspiration.completed}/${aspiration.total} milestones`}
              </div>
            </div>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${(aspiration.completed / Math.max(1, aspiration.total)) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {aspiration.milestones.map((entry) => (
              <div
                key={entry.milestone.id}
                className={`flex items-center gap-1.5 text-[10px] ${
                  entry.done ? 'text-emerald-300' : 'text-white/60'
                }`}
              >
                <span>{entry.done ? '✅' : entry.milestone.emoji}</span>
                <span className="flex-1 truncate">{entry.milestone.label}</span>
                {!entry.done && entry.target > 1 && (
                  <span className="tabular-nums text-white/40">
                    {entry.current}/{entry.target}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social card: who the selected Sim is talking to, and what they can do */}
      {socialTargetId && (() => {
        const partner = household.sims.find((m) => m.id === socialTargetId);
        const actor = household.sims.find((m) => m.id === selected?.id);
        if (!partner || !actor) return null;
        const rel = actor.relationships[partner.id] ?? { friendship: 0, romance: 0, kind: 'stranger' as const };
        const kind = relationKindFor(rel);
        return (
          <div className="absolute right-3 bottom-56 z-30 w-64 rounded-2xl border border-white/15 bg-slate-950/92 p-2.5 text-white shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold/80">With</span>
              <button
                type="button"
                onClick={() => setSocialTarget(null)}
                className="rounded px-1 text-[10px] text-white/50 hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-lg">{partner.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold">{partner.firstName}</div>
                <div className="text-[9px] text-white/50">
                  {friendshipLabel(rel.friendship)} · {kind}
                  {rel.romance > 0 ? ` · 💗 ${Math.round(rel.romance)}` : ''}
                </div>
              </div>
            </div>
            {/* Family: only offered when the pair actually qualify */}
            {(() => {
              const babyCheck = canTryForBaby(actor, partner, household.sims.length);
              const adoptCheck = canAdopt(actor, household.sims.length, household.funds);
              if (!babyCheck.ok && !adoptCheck.ok) return null;
              return (
                <div className="mt-2 flex flex-col gap-1 border-t border-white/10 pt-2">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white/40">Family</span>
                  {babyCheck.ok && (
                    <button
                      type="button"
                      onClick={() => tryForBaby(actor.id, partner.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-pink-500/20 px-2 py-1.5 text-left text-[11px] font-semibold text-pink-100 transition hover:bg-pink-500/30 cursor-pointer"
                    >
                      <span>🤰</span>
                      <span className="flex-1">Try for a Baby</span>
                    </button>
                  )}
                  {adoptCheck.ok && (
                    <button
                      type="button"
                      onClick={() => adoptChild(actor.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2 py-1.5 text-left text-[11px] font-semibold transition hover:bg-white/15 cursor-pointer"
                    >
                      <span>👶</span>
                      <span className="flex-1">Adopt a Child</span>
                      <span className="text-[9px] text-white/40">₦{ADOPTION_COST.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              );
            })()}

            <div className="mt-2 flex flex-col gap-1">
              {socialActions.map((def) => {
                const need = def.social?.requiresRelationship;
                const locked =
                  (need?.friendship !== undefined && rel.friendship < need.friendship) ||
                  (need?.romance !== undefined && rel.romance < need.romance) ||
                  (def.social?.targetStages !== undefined &&
                    !def.social.targetStages.includes(partner.stage));
                return (
                  <button
                    key={def.id}
                    type="button"
                    disabled={locked}
                    title={locked ? 'Not close enough yet' : def.label}
                    onClick={() => order(selected.id, def.id, partner.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-left text-[11px] font-semibold transition ${
                      locked ? 'cursor-not-allowed bg-white/5 text-white/30' : 'cursor-pointer bg-white/5 hover:bg-white/15'
                    }`}
                  >
                    <span>{def.emoji}</span>
                    <span className="flex-1">{def.label}</span>
                    <span className="text-[9px] text-white/40">{def.minutes}m</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Notifications */}
      <div className="pointer-events-none absolute top-20 right-3 z-30 flex w-64 flex-col gap-1.5">
        {notifications.slice(0, 4).map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => dismiss(n.id)}
            className="pointer-events-auto flex items-start gap-2 rounded-xl border border-white/15 bg-slate-950/90 px-2.5 py-2 text-left text-[11px] text-white shadow-lg backdrop-blur-md cursor-pointer"
          >
            <span>{n.emoji}</span>
            <span className="flex-1">{n.text}</span>
          </button>
        ))}
      </div>

      {/* Selected Sim detail — reuses the shared sim panel */}
      {mode === 'live' && selected && selectedAvatar && (
        <SimPanelView
          key={selected.id}
          avatar={selectedAvatar}
          clock={clock}
          speed={speed}
          autonomyEnabled={autonomyEnabled}
          events={events}
          week={Math.floor(parts.dayOffset / 7) + 1}
          room="living"
          defaultOpen
          showSpeedControls={false}
          availableActions={interactions}
          roomLabels={Object.fromEntries(
            Object.entries(LIFE_ROOM_LABELS).map(([id, meta]) => [id, `${meta.emoji} ${meta.label}`]),
          )}
          onSetSpeed={setSpeed}
          onToggleAutonomy={() => setAutonomy(!autonomyEnabled)}
          onOrder={(id) => order(selected.id, id)}
          onCancel={() => cancel(selected.id)}
          onClearQueue={() => clearQueueOf(selected.id)}
        />
      )}
    </>
  );
}
