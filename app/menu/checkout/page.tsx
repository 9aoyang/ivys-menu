'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import FamilyCard from '@/components/FamilyCard';
import PinPad from '@/components/PinPad';
import { getDraft, clearDraft, totalPrice, type CheckoutDraft } from '@/lib/checkout/draft';

type Phase = 'entering' | 'processing' | 'success' | 'error';

export default function Checkout() {
  const router = useRouter();
  const [draft, setDraftState] = useState<CheckoutDraft | null>(null);
  const [pin, setPin] = useState('');
  const [phase, setPhase] = useState<Phase>('entering');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const d = getDraft();
    if (!d) {
      router.replace('/menu');
      return;
    }
    setDraftState(d);
  }, [router]);

  const submit = async (password: string) => {
    if (!draft) return;
    setPhase('processing');
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password, items: draft.items }),
    });
    if (res.status === 401) {
      setErrMsg('密码错误');
      setPhase('error');
      setTimeout(() => {
        setPhase('entering');
        setPin('');
      }, 1200);
      return;
    }
    if (!res.ok) {
      setErrMsg('网络出错');
      setPhase('error');
      setTimeout(() => {
        setPhase('entering');
        setPin('');
      }, 1500);
      return;
    }
    setPhase('success');
    setTimeout(() => {
      clearDraft();
      router.replace('/menu/orders');
    }, 1400);
  };

  const onKey = (d: string) => {
    if (phase !== 'entering') return;
    if (d === '⌫') return setPin((p) => p.slice(0, -1));
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      void submit(next);
    }
  };

  if (!draft) return null;
  const total = totalPrice(draft);

  return (
    <main
      className="min-h-[100dvh] text-white p-6 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a1a2e 100%)' }}
    >
      <div className="text-[10px] tracking-[0.3em] text-zinc-500 text-center">
        CHECKOUT · ¥ {total}
      </div>

      <div className="flex-1 flex items-center justify-center my-6">
        <FamilyCard shake={phase === 'error'} />
      </div>

      <div className="mb-6 text-center">
        <div className="text-sm text-white mb-3">
          {phase === 'processing' && '支付中...'}
          {phase === 'success' && <span className="text-green-400">✓ 支付成功</span>}
          {phase === 'error' && <span className="text-red-400">{errMsg}</span>}
          {phase === 'entering' && '输入密码完成支付'}
        </div>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: i < pin.length ? '#a78bfa' : '#1a1a1a',
                scale: phase === 'success' ? 1.3 : 1,
              }}
              className="w-3 h-3 rounded-full border border-zinc-700"
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <PinPad onKey={onKey} />
      </div>
    </main>
  );
}
