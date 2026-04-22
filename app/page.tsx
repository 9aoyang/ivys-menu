'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRole, setRole, type Role } from '@/lib/role';

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    const r = getRole();
    if (r === 'ivy') router.replace('/menu');
    else if (r === 'chef') router.replace('/kitchen');
  }, [router]);

  const pick = (r: Role) => {
    setRole(r);
    router.replace(r === 'ivy' ? '/menu' : '/kitchen');
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-10 bg-black text-white p-6">
      <div className="text-center">
        <h1 className="text-4xl font-serif tracking-wide mb-2">Ivy&apos;s Menu</h1>
        <p className="text-zinc-400 text-sm">家庭私人餐厅 · 请选择您的身份</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => pick('ivy')}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          🍽️ 我是 Ivy
        </button>
        <button
          onClick={() => pick('chef')}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          👨‍🍳 我是主厨
        </button>
      </div>
      <p className="text-xs text-zinc-500 max-w-xs text-center">
        选定后记住本设备 · 换设备时重新选择
      </p>
    </main>
  );
}
