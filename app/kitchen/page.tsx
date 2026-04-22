import Link from 'next/link';
import { fetchOrdersForDate } from '@/lib/data/orders';
import TodayOrderCard from '@/components/kitchen/TodayOrderCard';

export const dynamic = 'force-dynamic';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function KitchenHome() {
  const today = todayIso();
  const orders = await fetchOrdersForDate(today);
  const breakfast = orders.find((o) => o.meal_type === 'breakfast');
  const dinner = orders.find((o) => o.meal_type === 'dinner');
  const weekend = orders.find((o) => o.meal_type === 'weekend');

  return (
    <main className="min-h-[100dvh] bg-black text-white p-5 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-5">
        <div>
          <div className="text-[10px] text-zinc-500 tracking-widest">KITCHEN</div>
          <h1 className="text-xl font-serif">👨‍🍳 后厨 · {today}</h1>
        </div>
      </header>

      {breakfast && (
        <TodayOrderCard
          order={breakfast}
          gradient="linear-gradient(135deg,#f59e0b,#d97706)"
          mealLabel="今日早餐"
          mealTime="07:30"
        />
      )}
      {dinner && (
        <TodayOrderCard
          order={dinner}
          gradient="linear-gradient(135deg,#ec4899,#be185d)"
          mealLabel="今日晚餐"
          mealTime="19:00"
        />
      )}
      {weekend && (
        <TodayOrderCard
          order={weekend}
          gradient="linear-gradient(135deg,#7c3aed,#5b21b6)"
          mealLabel="周末特供"
          mealTime="—"
        />
      )}

      {orders.length === 0 && (
        <div className="bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500 text-sm">
          今天没有订单
        </div>
      )}

      <nav className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
        <Link href="/kitchen/recipes" className="bg-zinc-900 py-3 rounded-lg">
          📖 菜谱
        </Link>
        <span className="bg-zinc-900/40 py-3 rounded-lg text-zinc-600">📅 本周 (wip)</span>
        <span className="bg-zinc-900/40 py-3 rounded-lg text-zinc-600">🛒 采购 (wip)</span>
      </nav>
    </main>
  );
}
