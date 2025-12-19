import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardMedia from '@mui/material/CardMedia';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/al/paths';
import { CONFIG } from 'src/global-config';

import useCartStore from 'src/stores/cart';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
};

export function CartModal({ open, onClose }: Props) {
   const router = useRouter();
   const {
      items,
      updateQty,
      removeItem,
      getTotalPrice,
      clearCart,
      validateAllStock,
      validateStock,
   } = useCartStore();

   const [loading, setLoading] = useState<boolean>(false);
   const [stockErrors, setStockErrors] = useState<string[]>([]);

   const totalPrice = getTotalPrice();

   const handleUpdateQty = async (productId: string, newQty: number, currentQty: number) => {
      if (newQty <= 0) {
         removeItem(productId);
         return;
      }

      // Only validate if increasing quantity
      if (newQty > currentQty) {
         const validation = await validateStock(productId, newQty);
         if (!validation.isValid) {
            toast.error(`Stock tidak mencukupi! Tersedia: ${validation.availableStock}`);
            return;
         }
      }

      updateQty(productId, newQty);
   };

   const handleCheckout = async () => {
      if (items.length === 0) {
         toast.error('Keranjang kosong');
         return;
      }

      setLoading(true);
      setStockErrors([]);

      try {
         // Validate all stock
         const validations = await validateAllStock();
         const errors: string[] = [];

         validations.forEach((validation) => {
            if (!validation.isValid) {
               errors.push(
                  `${validation.productTitle}: Stock tersedia ${validation.availableStock}, diminta ${validation.requestedQty}`
               );
            }
         });

         if (errors.length > 0) {
            setStockErrors(errors);
            setLoading(false);
            return;
         }

         // Redirect to checkout
         router.push(paths.dashboard.customer_orders.checkout);
         onClose();
      } catch (error) {
         toast.error('Gagal memvalidasi stock');
      }

      setLoading(false);
   };

   return (
      <Dialog
         open={open}
         onClose={onClose}
         maxWidth="md"
         fullWidth
         PaperProps={{
            sx: {
               width: '90%',
               maxWidth: '900px',
            },
         }}
      >
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Typography variant="h5">Shopping Cart</Typography>
               <IconButton onClick={onClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            {items.length === 0 ? (
               <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Iconify
                     icon="solar:cart-large-2-bold-duotone"
                     width={80}
                     sx={{ color: 'text.disabled', mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                     Keranjang kosong
                  </Typography>
               </Box>
            ) : (
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Stock Errors */}
                  {stockErrors.length > 0 && (
                     <Alert severity="error">
                        <Typography variant="subtitle2" gutterBottom>
                           Stock telah berubah:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                           {stockErrors.map((error, index) => (
                              <li key={index}>
                                 <Typography variant="body2">{error}</Typography>
                              </li>
                           ))}
                        </ul>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                           Silakan sesuaikan quantity atau hapus produk dari keranjang.
                        </Typography>
                     </Alert>
                  )}

                  {/* Cart Items */}
                  {items.map((item) => {
                     const imageUrl = item.product.image
                        ? `${process.env.NEXT_PUBLIC_API_HOST}/${item.product.image}`
                        : '/assets/placeholder.svg';

                     const subtotal = (item.product.sale_price || 0) * item.qty;

                     return (
                        <Box
                           key={item.product.id}
                           sx={{
                              display: 'flex',
                              gap: 2,
                              p: 2,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                           }}
                        >
                           {/* Product Image */}
                           <CardMedia
                              component="img"
                              image={imageUrl}
                              alt={item.product.title}
                              sx={{
                                 width: 100,
                                 height: 100,
                                 objectFit: 'cover',
                                 borderRadius: 1,
                                 bgcolor: 'background.neutral',
                              }}
                           />

                           {/* Product Info */}
                           <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                 {item.product.title}
                              </Typography>
                              <Typography variant="h6" color="primary.main" gutterBottom>
                                 {fCurrency(item.product.sale_price || 0)}
                              </Typography>

                              {/* Quantity Controls */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                 <IconButton
                                    size="small"
                                    onClick={() =>
                                       handleUpdateQty(item.product.id!, item.qty - 1, item.qty)
                                    }
                                    sx={{ border: 1, borderColor: 'divider' }}
                                 >
                                    <Iconify icon="solar:minus-circle-bold" width={20} />
                                 </IconButton>

                                 <Typography
                                    variant="body1"
                                    sx={{ minWidth: 40, textAlign: 'center' }}
                                 >
                                    {item.qty}
                                 </Typography>

                                 <IconButton
                                    size="small"
                                    onClick={() =>
                                       handleUpdateQty(item.product.id!, item.qty + 1, item.qty)
                                    }
                                    sx={{ border: 1, borderColor: 'divider' }}
                                 >
                                    <Iconify icon="solar:add-circle-bold" width={20} />
                                 </IconButton>
                              </Box>
                           </Box>

                           {/* Subtotal & Remove */}
                           <Box
                              sx={{
                                 display: 'flex',
                                 flexDirection: 'column',
                                 alignItems: 'flex-end',
                                 justifyContent: 'space-between',
                              }}
                           >
                              <IconButton
                                 size="small"
                                 color="error"
                                 onClick={() => removeItem(item.product.id!)}
                              >
                                 <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>

                              <Typography variant="h6" color="primary.main">
                                 {fCurrency(subtotal)}
                              </Typography>
                           </Box>
                        </Box>
                     );
                  })}

                  <Divider />

                  {/* Total */}
                  <Box
                     sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: 'background.neutral',
                        borderRadius: 1,
                     }}
                  >
                     <Typography variant="h6">Total:</Typography>
                     <Typography variant="h5" color="primary.main">
                        {fCurrency(totalPrice)}
                     </Typography>
                  </Box>
               </Box>
            )}
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            {items.length > 0 && (
               <Button onClick={() => clearCart()} variant="outlined" color="error">
                  Clear Cart
               </Button>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={onClose} variant="outlined" color="inherit">
               Continue Shopping
            </Button>
            <Button
               onClick={handleCheckout}
               variant="contained"
               disabled={loading || items.length === 0}
               startIcon={<Iconify icon="solar:card-send-bold" />}
            >
               {loading ? 'Validating...' : 'Checkout'}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
