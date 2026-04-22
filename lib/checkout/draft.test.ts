import { describe, it, expect, beforeEach } from 'vitest';
import { setDraft, getDraft, clearDraft, totalPrice } from './draft';

beforeEach(() => sessionStorage.clear());

describe('checkout draft', () => {
  it('stores a single-item draft', () => {
    setDraft({
      items: [
        { recipe_id: 'r1', serving: 1, meal_date: '2026-04-22', meal_type: 'dinner', price_snapshot: 42 },
      ],
    });
    const d = getDraft();
    expect(d?.items).toHaveLength(1);
    expect(d?.items[0].price_snapshot).toBe(42);
  });

  it('totalPrice sums price_snapshot × serving across items', () => {
    setDraft({
      items: [
        { recipe_id: 'r1', serving: 1, meal_date: '2026-04-22', meal_type: 'dinner', price_snapshot: 42 },
        { recipe_id: 'r2', serving: 2, meal_date: '2026-04-23', meal_type: 'breakfast', price_snapshot: 28 },
      ],
    });
    expect(totalPrice(getDraft()!)).toBe(42 + 28 * 2);
  });

  it('clearDraft removes storage', () => {
    setDraft({
      items: [
        { recipe_id: 'r1', serving: 1, meal_date: '2026-04-22', meal_type: 'dinner', price_snapshot: 42 },
      ],
    });
    clearDraft();
    expect(getDraft()).toBeNull();
  });
});
