import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';

import { CONFIG } from 'src/global-config';
import useProductReviewStore from 'src/stores/product-review';
import { Iconify } from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   productId: string | null;
   productTitle?: string;
};

export function ReviewListModal({ open, onClose, productId, productTitle }: Props) {
   const { getByProduct } = useProductReviewStore();
   const [reviews, setReviews] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (open && productId) {
         setLoading(true);
         getByProduct(productId, { limit: 100 })
            .then((res) => {
               if (res.success) {
                  setReviews(res.data.reviews || []);
               }
            })
            .finally(() => setLoading(false));
      } else {
         setReviews([]);
      }
   }, [open, productId, getByProduct]);

   const renderImages = (attachmentsJson: string) => {
      try {
         const images = JSON.parse(attachmentsJson);
         if (!Array.isArray(images) || images.length === 0) return null;

         return (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
               {images.map((img: string, idx: number) => (
                  <Box
                     key={idx}
                     component="img"
                     src={`${CONFIG.apiHostUrl}/${img}`}
                     alt={`Review Attachment ${idx + 1}`}
                     sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 1,
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                     }}
                     onClick={() => window.open(`${CONFIG.apiHostUrl}/${img}`, '_blank')}
                  />
               ))}
            </Box>
         );
      } catch (e) {
         return null;
      }
   };

   return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
         <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
         >
            <Box>
               <Typography variant="h6">Ulasan Produk</Typography>
               {productTitle && (
                  <Typography variant="body2" color="text.secondary">
                     {productTitle}
                  </Typography>
               )}
            </Box>
            <IconButton onClick={onClose}>
               <Iconify icon="solar:close-circle-bold" />
            </IconButton>
         </DialogTitle>

         <DialogContent sx={{ p: 0 }}>
            {loading ? (
               <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                     Memuat ulasan...
                  </Typography>
               </Box>
            ) : reviews.length === 0 ? (
               <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                     Belum ada ulasan untuk produk ini.
                  </Typography>
               </Box>
            ) : (
               <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {reviews.map((review, index) => (
                     <Box key={review.id}>
                        <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
                           <Avatar alt={review.user_name} sx={{ width: 40, height: 40 }}>
                              {review.user_name?.charAt(0).toUpperCase()}
                           </Avatar>

                           <Box sx={{ flexGrow: 1 }}>
                              <Box
                                 sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    mb: 0.5,
                                 }}
                              >
                                 <Typography variant="subtitle2">{review.user_name}</Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {fDate(review.created_at)}
                                 </Typography>
                              </Box>

                              <Rating size="small" value={review.rating} readOnly sx={{ mb: 1 }} />

                              {review.comment && (
                                 <Typography variant="body2" sx={{ mb: 1 }}>
                                    {review.comment}
                                 </Typography>
                              )}

                              {review.attachments && renderImages(review.attachments)}
                           </Box>
                        </Box>
                        {index !== reviews.length - 1 && <Divider />}
                     </Box>
                  ))}
               </Box>
            )}
         </DialogContent>
      </Dialog>
   );
}
