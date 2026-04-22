'use client';

import { motion } from 'framer-motion';

export default function FamilyCard({
  shake = false,
  holder = 'IVY',
}: {
  shake?: boolean;
  holder?: string;
}) {
  return (
    <motion.div
      animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="relative w-full max-w-sm aspect-[1.586/1] rounded-2xl p-5 text-white overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
        boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.5)',
      }}
    >
      <div className="flex justify-between items-start">
        <div className="text-[10px] tracking-[0.3em] opacity-80">HOUSEHOLD CARD</div>
        <div className="w-8 h-5 rounded bg-gradient-to-br from-amber-300 to-amber-500" />
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <div className="font-mono text-sm tracking-[0.3em] mb-3">•••• •••• •••• ❤️❤️❤️</div>
        <div className="flex justify-between text-[10px] opacity-80">
          <div>持卡人：{holder}</div>
          <div>∞/∞</div>
        </div>
      </div>
    </motion.div>
  );
}
