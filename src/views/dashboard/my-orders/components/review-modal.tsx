import type { OrderProduct } from 'src/types/order';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import useProductReviewStore from 'src/stores/product-review';

// ----------------------------------------------------------------------

const ReviewSchema = z.object({
   rating: z.number().min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
   comment: z.string().optional(),
   images: z.any().optional(),
});

type ReviewFormType = z.infer<typeof ReviewSchema>;

type Props = {
   open: boolean;
   onClose: () => void;
   orderId: string;
   orderProduct: OrderProduct | null;
   onRefresh?: () => void;
};

export function ReviewModal({ open, onClose, orderId, orderProduct, onRefresh }: Props) {
   const { add } = useProductReviewStore();
   const [loading, setLoading] = useState(false);

   const defaultValues: ReviewFormType = {
      rating: 5,
      comment: '',
      images: [],
   };

   const methods = useForm<ReviewFormType>({
      resolver: zodResolver(ReviewSchema),
      defaultValues,
   });

   const {
      handleSubmit,
      reset,
      formState: { isSubmitting },
   } = methods;

   const handleClose = () => {
      reset();
      onClose();
   };

   const onSubmit = handleSubmit(async (data) => {
      if (!orderProduct?.product_id) return;

      setLoading(true);
      try {
         const payload: any = {
            product_id: orderProduct.product_id,
            order_id: orderId,
            rating: data.rating,
            comment: data.comment,
         };

         if (data.images && data.images.length > 0) {
            payload.images = data.images;
         }

         const result = await add(payload);

         if (result.success) {
            toast.success(result.message || 'Review berhasil ditambahkan');
            if (onRefresh) onRefresh();
            handleClose();
         } else {
            toast.error(result.message || 'Gagal menambahkan review');
         }
      } catch (error) {
         console.error(error);
         toast.error('Terjadi kesalahan saat menyimpan review');
      } finally {
         setLoading(false);
      }
   });

   return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
         <DialogTitle>
            Berikan Ulasan
            {orderProduct?.product?.title && (
               <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {orderProduct.product.title}
               </Typography>
            )}
         </DialogTitle>

         <DialogContent sx={{ pt: 2 }}>
            <Form methods={methods} onSubmit={onSubmit}>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Typography variant="subtitle2">Rating:</Typography>
                     <Field.Rating name="rating" />
                  </Box>

                  <Field.Text
                     name="comment"
                     label="Komentar ulasan (Opsional)"
                     multiline
                     rows={4}
                  />

                  <Field.Upload
                     name="images"
                     multiple
                     maxSize={3145728} // 3MB
                     onDrop={(acceptedFiles) => {
                        const currentFiles = methods.getValues('images') || [];
                        methods.setValue('images', [...currentFiles, ...acceptedFiles]);
                     }}
                     onRemove={(file) => {
                        const currentFiles = methods.getValues('images') || [];
                        methods.setValue(
                           'images',
                           currentFiles.filter((f: any) => f !== file)
                        );
                     }}
                     onRemoveAll={() => methods.setValue('images', [])}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                     <Button variant="outlined" color="inherit" onClick={handleClose}>
                        Batal
                     </Button>
                     <Button type="submit" variant="contained" loading={isSubmitting || loading}>
                        Kirim Ulasan
                     </Button>
                  </Box>
               </Box>
            </Form>
         </DialogContent>
      </Dialog>
   );
}
