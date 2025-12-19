import * as z from 'zod';

// Principle Schema
export const PrincipleSchema = z.object({
   title: z.string().min(1, { message: 'Title is required!' }),
   address: z.string().min(1, { message: 'Address is required!' }),
   pic_name: z.string().optional(),
   contact_phone: z.string().optional(),
   contact_mail: z.string().email({ message: 'Invalid email address!' }).optional(),
});

export type PrincipleFormType = z.infer<typeof PrincipleSchema>;

export interface Principle {
   id?: string;
   created_at?: string;
   updated_at?: string;
   title?: string;
   address?: string;
   pic_name?: string;
   contact_phone?: string;
   contact_mail?: string;
}
