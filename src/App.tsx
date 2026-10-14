import { useEffect } from 'react';
import { CreateHousehold } from './components/CreateHousehold';
import { LifeHUD } from './components/LifeHUD';
import { BuildBuyPanel } from './components/BuildBuyPanel';
import { ToastContainer } from './components/ToastContainer';
import { HouseholdMenu } from './components/HouseholdMenu';
import { RelationshipsPanel } from './components/RelationshipsPanel';
import { GameCanvas } from './three/GameCanvas';
import { registerLotInteractions, useLifeStore } from './life/lifeStore';
import { useSimClock } from './sim/useSimClock';
import { useSimStore } from './sim/simStore';
import { getAvatarCollider } from './three/collisionStore';
import { computeMood } from './sim/moodlets';

// ---------------------------------------------------------------------------
// A life simulator.
//
// Create a household, move them onto a plot of land, and live. Sims have
// motives, moods, skills and free will. You build the house they live in,
// buy the objects that make their lives better, and they grow up, work and
// form relationships on their own.
// ---------------------------------------------------------------------------

export function App() {
  const household = useLifeStore((s) => s.household);

  useSimClock();

  // Keep the interaction registry in step with what stands on the lot.
  useEffect(() => {
    if (household) registerLotInteractions(household.lot);
  }, [household?.lot, household]);

  // Dev-only inspection hook: lets the end-to-end harness assert on real state
  // instead of scraping the DOM.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    // Direct store handles for the harness to drive the game headlessly.
    w.__lifeStore = useLifeStore;
    w.__simStore = useSimStore;
    w.__teleport = (simId: string, x: number, z: number) => {
      // Dev-only: place a Sim exactly, so tests can start from open ground.
      // Their current errand is dropped too, or they would walk straight back.
      useSimStore.getState().cancel(simId);
      void import('../src/three/collisionStore').then((mod) => {
        mod.forceAvatarPosition(simId, x, z);
      });
    };
    w.__life = () => {
      const life = useLifeStore.getState();
      const sim = useSimStore.getState();
      const home = life.household;
      return {
        hasHousehold: Boolean(home),
        funds: home?.funds ?? 0,
        selectedSimId: life.selectedSimId,
        mode: life.mode,
        wallMode: life.wallMode,
        socialTargetId: life.socialTargetId,
        objectCount: home?.lot.length ?? 0,
        wallCount: home?.plot.walls.length ?? 0,
        clock: sim.clock.totalMinutes,
        speed: sim.speed,
        sims:
          home?.sims.map((member) => {
            const collider = getAvatarCollider(member.id);
            const avatar = sim.avatars[member.id];
            return {
              id: member.id,
              name: member.firstName,
              stage: member.stage,
              career: member.career?.id ?? null,
              x: collider ? Number(collider.x.toFixed(2)) : null,
              z: collider ? Number(collider.z.toFixed(2)) : null,
              mood: avatar ? computeMood(avatar, sim.clock.totalMinutes).emotion : null,
              active: avatar?.active?.defId ?? null,
              activeTarget: avatar?.active?.targetSimId ?? null,
              relationships: Object.fromEntries(
                Object.entries(member.relationships).map(([id, rel]) => [
                  id,
                  { friendship: Math.round(rel.friendship), romance: Math.round(rel.romance), kind: rel.kind },
                ]),
              ),
            };
          }) ?? [],
      };
    };
  }, [household]);

  if (!household) return <CreateHousehold />;

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink">
      <GameCanvas />
      <LifeHUD />
      <HouseholdMenu />
      <RelationshipsPanel />
      <BuildBuyPanel />
      <ToastContainer />
    </div>
  );
}
