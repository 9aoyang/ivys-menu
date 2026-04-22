'use client';

import { useState } from 'react';
import MenuGrid from '@/components/MenuGrid';
import type { Recipe } from '@/lib/supabase/types';

type Tab = 'breakfast' | 'dinner' | 'weekend';

const LABELS: Record<Tab, string> = {
  breakfast: '🍳 早餐',
  dinner: '🍲 晚餐',
  weekend: '🏖️ 周末',
};

export default function MenuTabsClient({
  breakfast,
  dinner,
  weekend,
}: {
  breakfast: Recipe[];
  dinner: Recipe[];
  weekend: Recipe[];
}) {
  const [tab, setTab] = useState<Tab>('dinner');
  const data = { breakfast, dinner, weekend }[tab];

  return (
    <div className="px-4">
      <div className="flex gap-2 mb-4">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? 'bg-pink-600 text-white' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'dinner' && (
        <div className="mb-4 p-3 bg-zinc-900 rounded-xl text-xs text-zinc-400 text-center">
          ♡ 主厨将为您搭配两道当季时蔬
        </div>
      )}

      <MenuGrid recipes={data} />
    </div>
  );
}
