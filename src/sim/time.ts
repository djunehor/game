import type { SimClock, SimSpeed } from './types';

export const WEEK_DAYS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const MINUTES_PER_DAY = 24 * 60;

/** Real-time multipliers. Matches the Sims' pause / 1x / 2x / 3x feel. */
export const SPEED_MULTIPLIER: Record<SimSpeed, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 9,
};

export interface SpeedMeta {
  speed: SimSpeed;
  label: string;
  emoji: string;
}

export const SPEED_META: SpeedMeta[] = [
  { speed: 0, label: 'Pause', emoji: '⏸️' },
  { speed: 1, label: 'Normal', emoji: '▶️' },
  { speed: 2, label: 'Fast', emoji: '⏩' },
  { speed: 3, label: 'Ultra', emoji: '⏭️' },
];

export function createClock(startDay = 1, startHour = 8): SimClock {
  return {
    totalMinutes: 0,
    startDay,
    startHour,
    // At 1x, one sim minute passes per real second (a sim day ≈ 24 real minutes).
    minutesPerSecond: 1,
  };
}

/** Sim minutes earned for `realSeconds` of wall-clock time at the given speed. */
export function simMinutesFor(realSeconds: number, speed: SimSpeed, clock: SimClock): number {
  if (speed === 0 || realSeconds <= 0) return 0;
  return realSeconds * clock.minutesPerSecond * SPEED_MULTIPLIER[speed];
}

export interface ClockParts {
  /** 0-based day offset from the sim start. */
  dayOffset: number;
  /** 1-based show day (1 = Monday). */
  weekday: number;
  dayName: string;
  hour: number;
  minute: number;
  /** "08:30" */
  time: string;
  /** "Mon 08:30" */
  label: string;
}

export function clockParts(clock: SimClock): ClockParts {
  const absolute = clock.startHour * 60 + clock.totalMinutes;
  const dayOffset = Math.floor(absolute / MINUTES_PER_DAY);
  const minuteOfDay = ((absolute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = Math.floor(minuteOfDay % 60);
  const weekday = ((clock.startDay - 1 + dayOffset) % 7 + 7) % 7 + 1;
  const dayName = WEEK_DAYS[weekday] ?? 'Monday';
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return {
    dayOffset,
    weekday,
    dayName,
    hour,
    minute,
    time,
    label: `${dayName.slice(0, 3)} ${time}`,
  };
}

export function isNightHour(hour: number): boolean {
  return hour >= 21 || hour < 6;
}

/** Convenience: current clock parts for a raw minute total. */
export function partsAfter(clock: SimClock, minutes: number): ClockParts {
  return clockParts({ ...clock, totalMinutes: clock.totalMinutes + minutes });
}
