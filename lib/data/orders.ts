import { supabaseServer } from '@/lib/supabase/server';
import type { Order, Recipe } from '@/lib/supabase/types';

export interface OrderWithRecipe extends Order {
  recipe: Pick<Recipe, 'id' | 'name' | 'emoji' | 'cover_image_url' | 'short_desc'>;
}

const JOIN = `
  *,
  recipe:recipes!orders_main_recipe_id_fkey (id, name, emoji, cover_image_url, short_desc)
`;

export async function fetchRecentOrders(limit = 50): Promise<OrderWithRecipe[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('orders')
    .select(JOIN)
    .order('placed_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrderWithRecipe[];
}

export async function fetchOrdersForDate(dateIso: string): Promise<OrderWithRecipe[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('orders')
    .select(JOIN)
    .eq('meal_date', dateIso)
    .neq('status', 'cancelled')
    .order('meal_type');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrderWithRecipe[];
}

export async function fetchTodayOrders(): Promise<OrderWithRecipe[]> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return fetchOrdersForDate(`${yyyy}-${mm}-${dd}`);
}
