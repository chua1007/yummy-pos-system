import { z } from 'zod';

export const CreateOrderSchema = z.object({
  type: z.enum(['dine_in', 'takeaway', 'delivery']),
  tableId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(99),
        modifiers: z
          .array(
            z.object({
              modifierId: z.string().uuid(),
              quantity: z.number().int().min(1).default(1),
            }),
          )
          .optional(),
        notes: z.string().max(200).optional(),
      }),
    )
    .min(1),
  customerId: z.string().uuid().optional(),
  voucherCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']),
  reason: z.string().max(500).optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
