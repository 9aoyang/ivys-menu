import { fetchRecentOrders } from '@/lib/data/orders';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { text: string; color: string }> = {
  placed: { text: '已下单', color: 'bg-blue-900/40 text-blue-300' },
  accepted: { text: '已接单', color: 'bg-amber-900/40 text-amber-300' },
  cooking: { text: '正在制作', color: 'bg-rose-900/40 text-rose-300' },
  done: { text: '已完成', color: 'bg-emerald-900/40 text-emerald-300' },
  cancelled: { text: '已取消', color: 'bg-zinc-800 text-zinc-500' },
};

const MEAL_LABEL: Record<string, string> = {
  breakfast: '早餐',
  dinner: '晚餐',
  weekend: '周末',
};

export default async function OrdersPage() {
  const orders = await fetchRecentOrders();

  return (
    <main className="min-h-[100dvh] bg-black text-white p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-serif mb-5">我的订单</h1>

      {orders.length === 0 && <div className="text-zinc-500 text-center py-20">还没有订单</div>}

      <ul className="space-y-3">
        {orders.map((o) => {
          const s = STATUS[o.status];
          return (
            <li key={o.id} className="p-3 bg-zinc-900 rounded-2xl flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-3xl flex-shrink-0">
                {o.recipe.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{o.recipe.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {o.meal_date} · {MEAL_LABEL[o.meal_type]} × {o.serving}
                </div>
                <div className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${s.color}`}>
                  {s.text}
                </div>
              </div>
              <div className="text-pink-400 font-mono text-sm self-center">
                ¥ {o.price_snapshot * o.serving}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
