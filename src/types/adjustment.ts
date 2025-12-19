import * as z from 'zod';
import type { Product } from './product';

// Adjustment Schema
export const AdjustmentSchema = z.object({
   product_id: z.string().min(1, { message: 'Product is required!' }),
   qty: z.coerce.number().min(1, { message: 'Quantity must be at least 1!' }),
   is_increment: z.boolean(),
   description: z.string().optional(),
});

export type AdjustmentFormType = z.infer<typeof AdjustmentSchema>;

export interface Adjustment {
   id?: string;
   created_at?: string;
   updated_at?: string;
   product_id?: string;
   product?: Product;
   qty?: number;
   is_increment?: boolean;
   is_clear?: boolean;
   description?: string;
}
