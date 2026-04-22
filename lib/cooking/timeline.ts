import type { Step } from '@/lib/supabase/types';

export interface ScheduledStep extends Step {
  startAt: Date;
}

export interface CookingTimeline {
  totalDurationMin: number;
  startAt: Date;
  scheduled: ScheduledStep[];
}

export function buildCookingTimeline(steps: Step[], endAt: Date): CookingTimeline {
  const totalDurationMin = steps.reduce((acc, s) => acc + s.duration_min, 0);
  const startAt = new Date(endAt.getTime() - totalDurationMin * 60 * 1000);

  const scheduled: ScheduledStep[] = [];
  let cursor = startAt.getTime();
  for (const s of steps) {
    scheduled.push({ ...s, startAt: new Date(cursor) });
    cursor += s.duration_min * 60 * 1000;
  }

  return { totalDurationMin, startAt, scheduled };
}
