import { supabaseServer } from '@/lib/supabase/server';
import type { Recipe, MealType, RecipeRole } from '@/lib/supabase/types';

export async function fetchRecipesByMealType(
  mealType: MealType,
  role: RecipeRole,
  onlyActive = true,
): Promise<Recipe[]> {
  const sb = supabaseServer();
  let q = sb.from('recipes').select('*').eq('meal_type', mealType).eq('role', role);
  if (onlyActive) q = q.eq('is_active', true);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Recipe[];
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const sb = supabaseServer();
  const { data, error } = await sb.from('recipes').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Recipe | null) ?? null;
}

export async function fetchAllRecipes(): Promise<Recipe[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('recipes')
    .select('*')
    .order('meal_type')
    .order('role')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Recipe[];
}
