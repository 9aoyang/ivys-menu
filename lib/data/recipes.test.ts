import { describe, it, expect } from 'vitest';
import { fetchRecipesByMealType, fetchRecipeById } from './recipes';

describe('recipes data access', () => {
  it('fetches dinner mains (should include 奶油蘑菇汤 from seed)', async () => {
    const rows = await fetchRecipesByMealType('dinner', 'main');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.name === '奶油蘑菇汤')).toBe(true);
  });

  it('fetches dinner sides (should include 黄油芦笋 from seed)', async () => {
    const rows = await fetchRecipesByMealType('dinner', 'side');
    expect(rows.some((r) => r.name === '黄油芦笋')).toBe(true);
  });

  it('returns single recipe by id', async () => {
    const all = await fetchRecipesByMealType('dinner', 'main');
    const first = all[0];
    const got = await fetchRecipeById(first.id);
    expect(got?.name).toBe(first.name);
  });

  it('returns null for unknown id', async () => {
    const got = await fetchRecipeById('00000000-0000-0000-0000-000000000000');
    expect(got).toBeNull();
  });
});
