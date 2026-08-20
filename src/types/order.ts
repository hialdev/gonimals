import * as z from 'zod';
import type { Product } from './product';

// Order Product Schema
export const OrderProductSchema = z.object({
   product_id: z.string().min(1, { message: 'Product is required!' }),
   qty: z.number().min(1, { message: 'Quantity must be at least 1!' }),
});

export type OrderProductFormType = z.infer<typeof OrderProductSchema>;

// Order Schema
export const OrderSchema = z.object({
   user_id: z.string().min(1, { message: 'User ID is required!' }),
   address_receiver: z.string().min(1, { message: 'Receiver Address is required!' }),
   phone_receiver: z.string().min(1, { message: 'Receiver Phone is required!' }),
   notes: z.string().optional(),
   products: z.array(OrderProductSchema).min(1, { message: 'At least one product is required!' }),
});

export type OrderFormType = z.infer<typeof OrderSchema>;

export interface OrderProduct {
   id?: string;
   created_at?: string;
   updated_at?: string;
   order_id?: string;
   product_id?: string;
   product?: Product;
   price_at_order?: number;
   qty?: number;
   has_review?: boolean;
}

export interface Order {
   id?: string;
   created_at?: string;
   updated_at?: string;
   order_number?: string;
   user_id?: string;
   address_receiver?: string;
   phone_receiver?: string;
   status?:
      | 'waiting_payment'
      | 'waiting_confirmation'
      | 'on_progress'
      | 'delivered'
      | 'finish'
      | 'stock_issue'
      | 'waiting_restock'
      | 'refund_pending'
      | 'refunded'
      | 'canceled';
   notes?: string;
   total_bill?: number;
   xendit_invoice_id?: string;
   xendit_invoice_url?: string;
   bank_id?: string;
   bank?: {
      id?: string;
      name?: string;
      account_number?: string;
      account_name?: string;
   };
   transfer_proof?: string;
   order_products?: OrderProduct[];
   order_logs?: any[];
}
