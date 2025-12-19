import type { Product } from './product';

export interface StockMovement {
   id?: string;
   created_at?: string;
   updated_at?: string;
   product_id?: string;
   product?: Product;
   reference_type?: 'purchase' | 'order' | 'adjustment';
   reference_id?: string;
   qty?: number; // positive for increment, negative for decrement
   description?: string;
}
