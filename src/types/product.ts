import * as z from 'zod';
import { schemaUtils } from 'src/components/hook-form';

// Product Schema
export const ProductSchema = z.object({
   product_number: z.string().min(1, { message: 'Product Number is required!' }),
   product_type_id: z.string().min(1, { message: 'Product Type is required!' }),
   title: z.string().min(1, { message: 'Title is required!' }),
   slug: z.string().min(1, { message: 'Slug is required!' }),
   image: schemaUtils.file({ error: 'Image is required!' }).optional(),
   description: z.string().optional(),
   sale_price: z.number().min(0, { message: 'Sale Price must be greater than 0!' }),
   content: z.string().optional(),
   is_active: z.boolean().optional(),
});

export type ProductFormType = z.infer<typeof ProductSchema>;

export interface Product {
   id?: string;
   created_at?: string;
   updated_at?: string;
   product_number?: string;
   product_type_id?: string;
   product_type?: {
      id?: string;
      title?: string;
      slug?: string;
   };
   title?: string;
   slug?: string;
   image?: string | File;
   description?: string;
   sale_price?: number;
   content?: string;
   is_active?: boolean;
   stock?: number;
   deleted_at?: string | null;
}
