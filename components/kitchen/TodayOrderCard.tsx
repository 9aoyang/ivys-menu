'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OrderWithRecipe } from '@/lib/data/orders';
import type { OrderStatus } from '@/lib/supabase/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: '新订单',
  accepted: '已接单',
  cooking: '制作中',
  done: '已完成',
  cancelled: '已取消',
};

const NEXT_CTA: Partial<Record<OrderStatus, string>> = {
  placed: '接单',
  accepted: '开始制作',
  cooking: '出餐',
};

export default function TodayOrderCard({
  order,
  gradient,
  mealLabel,
  mealTime,
}: {
  order: OrderWithRecipe;
  gradient: string;
  mealLabel: string;
  mealTime: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const cta = NEXT_CTA[order.status];

  const advance = async () => {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${order.id}/advance`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('推进失败');
  };

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: gradient }}>
      <div className="text-[10px] tracking-widest opacity-80 text-white">
        {mealLabel} · {mealTime}
      </div>
      <div className="flex gap-3 mt-2 items-center">
        <div className="text-4xl">{order.recipe.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{order.recipe.name}</div>
          <div className="text-xs text-white/80 mt-0.5">× {order.serving} 份</div>
        </div>
        {cta ? (
          <button
            onClick={advance}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-full bg-white/20 text-white font-semibold active:scale-95 disabled:opacity-50"
          >
            {cta}
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/70">
            {STATUS_LABEL[order.status]}
          </span>
        )}
      </div>
      <Link
        href={`/kitchen/recipes/${order.recipe.id}`}
        className="block mt-2 text-[10px] text-white/70 underline"
      >
        查看烹饪步骤 →
      </Link>
    </div>
  );
}
