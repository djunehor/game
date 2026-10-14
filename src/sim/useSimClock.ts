import { useEffect } from 'react';
import {
  connectSocialOutcomes,
  evaluateAspirations,
  evaluateConsequences,
  syncLifeClock,
  syncLifeSims,
} from '../life/bridge';
import { useLifeStore } from '../life/lifeStore';
import { useSimStore } from './simStore';
import { setKeyAction } from '../three/input';

/** How often the simulation advances, in milliseconds of real time. */
const TICK_MS = 250;
/** Never advance more than this in one tick (tab was backgrounded, etc.). */
const MAX_STEP_SECONDS = 0.5;

/**
 * Drives the live simulation off requestAnimationFrame: the clock, motive
 * decay, autonomy, ageing and the day rollover.
 */
export function useSimClock(): void {
  const castKey = useLifeStore((s) =>
    s.household ? s.household.sims.map((sim) => `${sim.id}:${sim.traits.join('+')}`).join(',') : '',
  );

  // Shortcuts: space pauses, 1/2/3 set the speed.
  useEffect(() => {
    setKeyAction((code) => {
      const sim = useSimStore.getState();
      if (code === 'Space') {
        sim.togglePause();
        return true;
      }
      if (code === 'Digit1') { sim.setSpeed(1); return true; }
      if (code === 'Digit2') { sim.setSpeed(2); return true; }
      if (code === 'Digit3') { sim.setSpeed(3); return true; }
      return false;
    });
    return () => setKeyAction(null);
  }, []);

  // Let resolved Sim-to-Sim interactions reach the household.
  useEffect(() => {
    connectSocialOutcomes();
    return () => useSimStore.getState().setSocialSink(null);
  }, []);

  // Seed / re-seed Sims whenever the cast changes.
  useEffect(() => {
    syncLifeSims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let accumulator = 0;
    let aspirationAccumulator = 0;

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, MAX_STEP_SECONDS);
      last = now;
      accumulator += dt;
      if (accumulator < TICK_MS / 1000) return;

      const step = accumulator;
      accumulator = 0;
      useSimStore.getState().tick(step);
      if (useLifeStore.getState().household) {
        syncLifeClock();
        // Goals are cheap to check; once a second is plenty.
        aspirationAccumulator += step;
        if (aspirationAccumulator >= 1) {
          aspirationAccumulator = 0;
          evaluateAspirations();
          evaluateConsequences();
        }
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
}
