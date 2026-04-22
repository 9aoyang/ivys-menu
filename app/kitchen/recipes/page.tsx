import Link from 'next/link';
import { fetchAllRecipes } from '@/lib/data/recipes';

export const dynamic = 'force-dynamic';

const MEAL_LABELS: Record<string, string> = {
  breakfast: '🍳 早餐',
  dinner: '🍲 晚餐',
  weekend: '🏖️ 周末',
};

export default async function RecipesPage() {
  const recipes = await fetchAllRecipes();
  const byMeal = recipes.reduce<Record<string, typeof recipes>>((acc, r) => {
    (acc[r.meal_type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <main className="p-6 text-white max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/kitchen" className="text-xs text-zinc-500 hover:text-zinc-300">← 回厨房</Link>
        <h1 className="text-2xl font-semibold mt-2">菜谱库</h1>
        <p className="text-sm text-zinc-500 mt-1">共 {recipes.length} 道菜</p>
      </div>

      {(['breakfast', 'dinner', 'weekend'] as const).map((mt) => {
        const list = byMeal[mt] ?? [];
        if (list.length === 0) return null;
        return (
          <section key={mt} className="mb-8">
            <h2 className="text-sm text-zinc-400 tracking-widest mb-3">
              {MEAL_LABELS[mt]} · {list.length}
            </h2>
            <ul className="space-y-2">
              {list.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/kitchen/recipes/${r.id}`}
                    className="flex gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
                      {r.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{r.short_desc}</div>
                    </div>
                    <div className="text-xs text-zinc-500 self-center whitespace-nowrap">
                      {r.cook_time_min} min · {r.role === 'main' ? '主菜' : '配菜'}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {recipes.length === 0 && (
        <div className="text-center text-zinc-500 py-20">
          <p>还没有菜谱</p>
          <p className="text-xs mt-2">通过 Claude Code 对话录入</p>
        </div>
      )}
    </main>
  );
}
