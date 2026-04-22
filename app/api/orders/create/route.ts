import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { CreateOrdersInput } from '@/lib/api/orders';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateOrdersInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { password, items } = parsed.data;

  if (password !== process.env.FAMILY_CARD_PASSWORD) {
    return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
  }

  const sb = supabaseServer();
  const now = new Date().toISOString();
  const rows = items.map((i) => ({
    main_recipe_id: i.recipe_id,
    serving: i.serving,
    meal_date: i.meal_date,
    meal_type: i.meal_type,
    price_snapshot: i.price_snapshot,
    note: i.note ?? null,
    paid_at: now,
    status: 'placed' as const,
  }));

  const { data, error } = await sb.from('orders').insert(rows).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ order_ids: data.map((r) => r.id) });
}
