import type { Product } from 'src/types/product';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardMedia from '@mui/material/CardMedia';
import Rating from '@mui/material/Rating';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';
import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import useProductReviewStore from 'src/stores/product-review';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   product: Product | null;
   onAddToCart: () => void;
};

export function ProductDetailsModal({ open, onClose, product, onAddToCart }: Props) {
   const { getByProduct } = useProductReviewStore();
   const [reviews, setReviews] = useState<any[]>([]);
   const [stats, setStats] = useState<any>(null);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (open && product?.id) {
         fetchReviews();
      }
   }, [open, product]);

   const fetchReviews = async () => {
      setLoading(true);
      try {
         const res = await getByProduct(product!.id!, { limit: 10 });
         if (res.success) {
            setReviews(res.data.reviews || []);
            setStats(res.data.stats);
         }
      } catch (error) {
         console.error(error);
      } finally {
         setLoading(false);
      }
   };

   if (!product) return null;

   const imageUrl = product.image
      ? `${CONFIG.apiHostUrl}/${product.image}`
      : '/assets/placeholder.svg';

   return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle sx={{ p: 0 }}>
            {/* Header Content can be placed here if needed */}
         </DialogTitle>

         <DialogContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
               {/* Left Image Section */}
               <Box sx={{ width: { xs: '100%', md: '50%' }, bgcolor: 'background.neutral' }}>
                  <CardMedia
                     component="img"
                     image={imageUrl}
                     alt={product.title}
                     sx={{
                        width: '100%',
                        height: '100%',
                        minHeight: { xs: 300, md: 500 },
                        objectFit: 'cover',
                     }}
                  />
               </Box>

               {/* Right Info Section */}
               <Box
                  sx={{
                     width: { xs: '100%', md: '50%' },
                     p: 4,
                     display: 'flex',
                     flexDirection: 'column',
                  }}
               >
                  <Typography variant="h4" gutterBottom>
                     {product.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                     <Rating
                        size="small"
                        value={stats ? parseFloat(stats.average_rating) : 0}
                        readOnly
                        precision={0.1}
                     />
                     <Typography variant="body2" color="text.secondary">
                        ({stats?.total_reviews || 0} Ulasan)
                     </Typography>
                  </Box>

                  <Typography variant="h5" color="primary.main" sx={{ mb: 3 }}>
                     {fCurrency(product.sale_price || 0)}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                     Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                     {product.description || 'Tidak ada deskripsi singkat.'}
                  </Typography>

                  <Button
                     size="large"
                     variant="contained"
                     startIcon={<Iconify icon="solar:cart-plus-bold" />}
                     onClick={() => {
                        onAddToCart();
                     }}
                     disabled={!product.stock || product.stock <= 0}
                     sx={{ mt: 'auto' }}
                  >
                     Add to Cart
                  </Button>
               </Box>
            </Box>

            <Divider />

            {/* Content & Reviews Section */}
            <Box sx={{ p: 4 }}>
               {product.content && (
                  <Box sx={{ mb: 6 }}>
                     <Typography variant="h6" gutterBottom>
                        Additional Details
                     </Typography>
                     <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
                        <ReactMarkdown>{product.content}</ReactMarkdown>
                     </Box>
                  </Box>
               )}

               <Typography variant="h6" gutterBottom>
                  Product Reviews ({stats?.total_reviews || 0})
               </Typography>

               {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                     <CircularProgress />
                  </Box>
               ) : reviews.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                     Belum ada ulasan untuk produk ini.
                  </Typography>
               ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                     {reviews.map((review) => {
                        let attachedImages: string[] = [];
                        if (review.attachments) {
                           try {
                              attachedImages = JSON.parse(review.attachments);
                           } catch (e) {}
                        }

                        return (
                           <Card
                              key={review.id}
                              sx={{
                                 p: 3,
                                 display: 'flex',
                                 gap: 2,
                                 variant: 'outlined',
                                 boxShadow: 'none',
                                 border: '1px solid',
                                 borderColor: 'divider',
                              }}
                           >
                              <Avatar sx={{ width: 48, height: 48 }}>
                                 {review.user_name?.charAt(0).toUpperCase()}
                              </Avatar>

                              <Box sx={{ flex: 1 }}>
                                 <Box
                                    sx={{
                                       display: 'flex',
                                       justifyContent: 'space-between',
                                       alignItems: 'center',
                                       mb: 0.5,
                                    }}
                                 >
                                    <Typography variant="subtitle2">
                                       {review.user_name || 'Anonymous User'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                       {dayjs(review.created_at).format('DD MMM YYYY')}
                                    </Typography>
                                 </Box>

                                 <Rating
                                    size="small"
                                    value={review.rating}
                                    readOnly
                                    sx={{ mb: 1 }}
                                 />

                                 <Typography variant="body2">{review.comment}</Typography>

                                 {attachedImages.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                       {attachedImages.map((img, idx) => (
                                          <Box
                                             key={idx}
                                             component="img"
                                             src={`${CONFIG.apiHostUrl}/${img}`}
                                             alt="Review Attachment"
                                             sx={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 1,
                                                objectFit: 'cover',
                                             }}
                                          />
                                       ))}
                                    </Box>
                                 )}
                              </Box>
                           </Card>
                        );
                     })}
                  </Box>
               )}
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 4, pb: 4 }}>
            <Button onClick={onClose} variant="outlined" color="inherit">
               Close
            </Button>
         </DialogActions>
      </Dialog>
   );
}
