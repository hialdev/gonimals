import * as z from 'zod';
import type { Product } from './product';
import type { Principle } from './principle';

// Purchase Item Schema (for form)
export const PurchaseItemSchema = z.object({
   product_id: z.string().min(1, { message: 'Product is required!' }),
   qty: z.coerce.number().min(1, { message: 'Quantity must be at least 1!' }),
   purchase_price: z.coerce.number().min(0, { message: 'Purchase Price must be at least 0!' }),
});

export type PurchaseItemFormType = z.infer<typeof PurchaseItemSchema>;

// Purchase Schema (for form)
export const PurchaseSchema = z.object({
   principle_id: z.string().min(1, { message: 'Supplier is required!' }),
   purchase_date: z
      .string()
      .min(1, { message: 'Purchase Date is required!' })
      .refine(
         (val) => {
            const date = new Date(val);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return date <= today;
         },
         { message: 'Purchase date cannot be in the future!' }
      ),
   expected_arrival_date: z.string().optional(),
   notes: z.string().optional(),
   items: z.array(PurchaseItemSchema).min(1, { message: 'At least one product is required!' }),
});

export type PurchaseFormType = z.infer<typeof PurchaseSchema>;

// Backend interfaces
export interface PurchaseProduct {
   id?: string;
   created_at?: string;
   updated_at?: string;
   purchase_id?: string;
   product_id?: string;
   product?: Product;
   qty?: number;
   received_qty?: number;
   remaining_qty?: number; // computed by backend
   purchase_price?: number;
   subtotal?: number;
}

export interface Purchase {
   id?: string;
   created_at?: string;
   updated_at?: string;
   purchase_number?: string;
   purchase_date?: string;
   expected_arrival_date?: string;
   received_date?: string;
   status?: 'draft' | 'completed' | 'cancelled' | 'partial';
   is_clear?: boolean;
   principle_id?: string;
   principle?: Principle;
   total_price?: number;
   notes?: string;
   attachments?: string;
   purchase_products?: PurchaseProduct[];
   // Alias for form compatibility
   items?: PurchaseProduct[];
}
