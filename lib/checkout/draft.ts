import type { MealType } from '@/lib/supabase/types';

export interface DraftItem {
  recipe_id: string;
  serving: number;
  meal_date: string;
  meal_type: MealType;
  price_snapshot: number;
}

export interface CheckoutDraft {
  items: DraftItem[];
}

const KEY = 'ivys-menu:checkout-draft';

export function setDraft(d: CheckoutDraft) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(d));
}

export function getDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

export function totalPrice(d: CheckoutDraft): number {
  return d.items.reduce((acc, i) => acc + i.price_snapshot * i.serving, 0);
}
