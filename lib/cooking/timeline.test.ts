import { describe, it, expect } from 'vitest';
import { buildCookingTimeline } from './timeline';
import type { Step } from '@/lib/supabase/types';

describe('buildCookingTimeline', () => {
  const steps: Step[] = [
    { content: '洗菜', duration_min: 5, phase: '备菜' },
    { content: '煸炒', duration_min: 10, phase: '主做' },
    { content: '装盘', duration_min: 2, phase: '收尾' },
  ];

  it('sums step durations', () => {
    const result = buildCookingTimeline(steps, new Date('2026-04-21T19:00:00+08:00'));
    expect(result.totalDurationMin).toBe(17);
  });

  it('computes start time by subtracting total from end time', () => {
    const result = buildCookingTimeline(steps, new Date('2026-04-21T19:00:00+08:00'));
    expect(result.startAt.toISOString()).toBe('2026-04-21T10:43:00.000Z');
  });

  it('assigns absolute times to each step', () => {
    const result = buildCookingTimeline(steps, new Date('2026-04-21T19:00:00+08:00'));
    expect(result.scheduled).toHaveLength(3);
    expect(result.scheduled[0].startAt.toISOString()).toBe('2026-04-21T10:43:00.000Z');
    expect(result.scheduled[1].startAt.toISOString()).toBe('2026-04-21T10:48:00.000Z');
    expect(result.scheduled[2].startAt.toISOString()).toBe('2026-04-21T10:58:00.000Z');
  });

  it('handles empty steps gracefully', () => {
    const result = buildCookingTimeline([], new Date('2026-04-21T19:00:00+08:00'));
    expect(result.totalDurationMin).toBe(0);
    expect(result.scheduled).toEqual([]);
  });
});
