import * as z from 'zod';
import { schemaUtils } from 'src/components/hook-form';

// ProductType Schema
export const ProductTypeSchema = z.object({
   title: z.string().min(1, { message: 'Title is required!' }),
   slug: z.string().min(1, { message: 'Slug is required!' }),
   image: schemaUtils.file({ error: 'Image is required!' }).optional(),
   description: z.string().optional(),
});

export type ProductTypeType = z.infer<typeof ProductTypeSchema>;

export interface ProductType {
   id?: string;
   created_at?: string;
   updated_at?: string;
   title?: string;
   slug?: string;
   image?: string | File | undefined;
   description?: string;
}
