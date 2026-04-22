import { fetchRecipesByMealType } from '@/lib/data/recipes';
import MenuTabsClient from './MenuTabsClient';

export const dynamic = 'force-dynamic';

export default async function MenuHome() {
  const [breakfast, dinnerMain, weekend] = await Promise.all([
    fetchRecipesByMealType('breakfast', 'main'),
    fetchRecipesByMealType('dinner', 'main'),
    fetchRecipesByMealType('weekend', 'main'),
  ]);

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <header className="p-5 pb-3">
        <div className="text-xs text-pink-400 tracking-widest">TONIGHT&apos;S MENU</div>
        <h1 className="text-2xl font-serif mt-1">Ivy&apos;s Menu</h1>
      </header>
      <MenuTabsClient breakfast={breakfast} dinner={dinnerMain} weekend={weekend} />
    </main>
  );
}
