import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { fetchRecipeById } from '@/lib/data/recipes';
import CookingTimeline from '@/components/CookingTimeline';

export const dynamic = 'force-dynamic';

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await fetchRecipeById(id);
  if (!recipe) notFound();

  return (
    <main className="p-6 text-white max-w-2xl mx-auto">
      <Link href="/kitchen/recipes" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← 回菜谱库
      </Link>

      <div className="mt-4 relative aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-900">
        <Image
          src={recipe.cover_image_url}
          alt={recipe.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="mt-5">
        <h1 className="text-3xl font-serif">
          {recipe.emoji} {recipe.name}
        </h1>
        <p className="text-sm text-zinc-400 mt-1 italic">{recipe.short_desc}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {recipe.taste_tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 bg-zinc-900 rounded-full text-zinc-400">
              {t}
            </span>
          ))}
          <span className="text-xs px-2 py-1 bg-violet-900/40 rounded-full text-violet-300">
            ¥ {recipe.price} · {recipe.cook_time_min} min · {recipe.difficulty}
          </span>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm tracking-widest text-zinc-400 mb-3">食材</h2>
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between border-b border-zinc-900 pb-1">
              <span>
                {ing.name} <span className="text-zinc-600 text-xs">· {ing.category}</span>
              </span>
              <span className="text-zinc-400 font-mono">
                {ing.amount} {ing.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm tracking-widest text-zinc-400 mb-3">烹饪时间线</h2>
        <CookingTimeline steps={recipe.steps} />
      </section>

      {recipe.tips && (
        <section className="mt-8 p-4 bg-amber-950/30 border border-amber-900/50 rounded-xl">
          <div className="text-xs text-amber-500 tracking-widest mb-1">TIPS</div>
          <p className="text-sm text-amber-100">{recipe.tips}</p>
        </section>
      )}

      {recipe.source_url && (
        <p className="mt-6 text-xs text-zinc-500">
          来源：
          <a href={recipe.source_url} className="underline" target="_blank" rel="noreferrer">
            {recipe.source_url}
          </a>
        </p>
      )}
    </main>
  );
}
