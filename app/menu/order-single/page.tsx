'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { setDraft } from '@/lib/checkout/draft';
import type { Recipe } from '@/lib/supabase/types';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function OrderSinglePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const recipeId = sp.get('recipe');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [serving, setServing] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) {
      router.replace('/menu');
      return;
    }
    const sb = supabaseBrowser();
    sb.from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle()
      .then(({ data }) => {
        const r = data as Recipe | null;
        setRecipe(r);
        if (r) setServing(r.serving_default);
        setLoading(false);
      });
  }, [recipeId, router]);

  if (loading) return <div className="p-8 text-zinc-500">加载中...</div>;
  if (!recipe) return <div className="p-8 text-zinc-500">未找到菜品</div>;

  const onCheckout = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDraft({
      items: [
        {
          recipe_id: recipe.id,
          serving,
          meal_date: `${yyyy}-${mm}-${dd}`,
          meal_type: recipe.meal_type,
          price_snapshot: recipe.price,
        },
      ],
    });
    router.push('/menu/checkout');
  };

  return (
    <main className="min-h-[100dvh] bg-black text-white p-5 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-xs text-zinc-500">
        ← 回菜单
      </button>

      <div className="mt-4 relative aspect-square rounded-2xl overflow-hidden bg-zinc-900">
        <Image
          src={recipe.cover_image_url}
          alt={recipe.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="mt-5">
        <h1 className="text-2xl font-serif">
          {recipe.emoji} {recipe.name}
        </h1>
        <p className="text-sm text-zinc-400 italic mt-1">{recipe.short_desc}</p>
        <div className="mt-2 text-lg text-pink-400 font-mono">¥ {recipe.price}</div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className="text-sm text-zinc-400">份数</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setServing(Math.max(1, serving - 1))}
            className="w-9 h-9 rounded-full bg-zinc-800 text-xl active:scale-95"
          >
            −
          </button>
          <div className="w-8 text-center font-mono">{serving}</div>
          <button
            onClick={() => setServing(serving + 1)}
            className="w-9 h-9 rounded-full bg-zinc-800 text-xl active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="mt-10 w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 font-semibold text-lg active:scale-[0.98] shadow-xl"
      >
        确认下单 · ¥ {recipe.price * serving}
      </button>
    </main>
  );
}
