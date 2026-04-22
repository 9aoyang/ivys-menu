import { z } from 'zod';

export const CreateOrdersInput = z.object({
  password: z.string().length(6),
  items: z
    .array(
      z.object({
        recipe_id: z.string().uuid(),
        serving: z.number().int().min(1),
        meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        meal_type: z.enum(['breakfast', 'dinner', 'weekend']),
        price_snapshot: z.number().int().min(0),
        note: z.string().optional(),
      }),
    )
    .min(1),
});

export type CreateOrdersPayload = z.infer<typeof CreateOrdersInput>;

export const AdvanceOrderInput = z.object({
  order_id: z.string().uuid(),
  action: z.enum(['accept', 'start_cooking', 'done', 'cancel']),
});

export type AdvanceOrderPayload = z.infer<typeof AdvanceOrderInput>;
