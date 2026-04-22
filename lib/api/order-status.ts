import type { OrderStatus } from '@/lib/supabase/types';

const CHAIN: Record<OrderStatus, OrderStatus | null> = {
  placed: 'accepted',
  accepted: 'cooking',
  cooking: 'done',
  done: null,
  cancelled: null,
};

export function nextStatus(current: OrderStatus): OrderStatus | null {
  return CHAIN[current];
}

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === 'cancelled') return from !== 'done' && from !== 'cancelled';
  return CHAIN[from] === to;
}

export const STATUS_TIMESTAMP_FIELD: Record<OrderStatus, string | null> = {
  placed: 'placed_at',
  accepted: 'accepted_at',
  cooking: 'cooking_at',
  done: 'done_at',
  cancelled: 'cancelled_at',
};
