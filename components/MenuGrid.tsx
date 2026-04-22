'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Recipe } from '@/lib/supabase/types';

export default function MenuGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return <div className="text-zinc-500 text-center py-16 text-sm">暂无菜品</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {recipes.map((r) => (
        <Link
          key={r.id}
          href={`/menu/order-single?recipe=${r.id}`}
          className="aspect-square rounded-2xl overflow-hidden relative bg-zinc-900 active:scale-[0.98] transition-transform"
        >
          <Image src={r.cover_image_url} alt={r.name} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="text-lg">{r.emoji}</div>
            <div className="font-semibold text-sm leading-tight mt-0.5">{r.name}</div>
            <div className="text-xs text-zinc-300 mt-0.5 line-clamp-1">{r.short_desc}</div>
            <div className="text-xs text-pink-300 mt-1 font-mono">¥ {r.price}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
