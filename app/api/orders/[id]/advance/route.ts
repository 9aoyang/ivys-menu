import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { nextStatus, isValidTransition, STATUS_TIMESTAMP_FIELD } from '@/lib/api/order-status';
import type { Order, OrderStatus } from '@/lib/supabase/types';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const target = body?.to as OrderStatus | undefined;

  const sb = supabaseServer();
  const { data: orderData, error: fetchErr } = await sb
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!orderData) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const order = orderData as Order;
  const next = target ?? nextStatus(order.status);
  if (!next) return NextResponse.json({ error: 'terminal_state' }, { status: 400 });
  if (!isValidTransition(order.status, next)) {
    return NextResponse.json(
      { error: `invalid_transition_${order.status}_${next}` },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const stampField = STATUS_TIMESTAMP_FIELD[next];
  const updates: Record<string, unknown> = { status: next };
  if (stampField) updates[stampField] = now;

  const { data, error } = await sb.from('orders').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
