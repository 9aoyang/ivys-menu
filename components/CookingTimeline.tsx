'use client';

import { useMemo, useState } from 'react';
import { buildCookingTimeline } from '@/lib/cooking/timeline';
import type { Step } from '@/lib/supabase/types';

export default function CookingTimeline({ steps }: { steps: Step[] }) {
  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    return d;
  }, []);

  const [endIso, setEndIso] = useState(() => toLocalInputValue(defaultEnd));
  const end = new Date(endIso);
  const tl = buildCookingTimeline(steps, end);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-zinc-400">
          总耗时 <span className="text-white font-semibold">{tl.totalDurationMin}</span> min
        </div>
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          出餐时间
          <input
            type="datetime-local"
            value={endIso}
            onChange={(e) => setEndIso(e.target.value)}
            className="bg-zinc-900 text-white text-xs px-2 py-1 rounded border border-zinc-700"
          />
        </label>
      </div>

      <div className="relative pl-5">
        <div className="absolute left-1 top-3 bottom-3 w-0.5 bg-zinc-800" />
        {tl.scheduled.map((s, i) => (
          <div key={i} className="relative mb-4">
            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-black" />
            <div className="text-xs text-zinc-500">
              {formatTime(s.startAt)} · {s.phase} · {s.duration_min} min
            </div>
            <div className="text-sm mt-0.5">{s.content}</div>
          </div>
        ))}
        {tl.scheduled.length > 0 && (
          <div className="relative">
            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black" />
            <div className="text-xs text-green-400">
              {formatTime(end)} · ✓ 出餐
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
