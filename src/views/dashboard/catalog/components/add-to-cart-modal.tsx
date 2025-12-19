import type { Product } from 'src/types/product';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';

import { CONFIG } from 'src/global-config';

import useCartStore from 'src/stores/cart';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   product: Product;
};

export function AddToCartModal({ open, onClose, product }: Props) {
   const { addItem, validateStock } = useCartStore();

   const [qty, setQty] = useState<number>(1);
   const [loading, setLoading] = useState<boolean>(false);
   const [stockError, setStockError] = useState<string>('');

   const imageUrl = product.image
      ? `${process.env.NEXT_PUBLIC_API_HOST}/${product.image}`
      : '/assets/placeholder.svg';

   const currentStock = product.stock || 0;
   const subtotal = (product.sale_price || 0) * qty;

   const handleAddToCart = async () => {
      setLoading(true);
      setStockError('');

      try {
         // Validate stock from backend
         const validation = await validateStock(product.id!, qty);

         if (!validation.isValid) {
            setStockError(
               `Stock tidak mencukupi! Stock tersedia: ${validation.availableStock}. Silakan sesuaikan quantity.`
            );
            setLoading(false);
            return;
         }

         // Add to cart
         addItem(product, qty);
         toast.success('Produk berhasil ditambahkan ke keranjang');
         onClose();
         setQty(1);
      } catch (error) {
         toast.error('Gagal menambahkan produk ke keranjang');
      }

      setLoading(false);
   };

   const handleClose = () => {
      setQty(1);
      setStockError('');
      onClose();
   };

   return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
         <DialogTitle>Add to Cart</DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
               {/* Product Image */}
               <CardMedia
                  component="img"
                  height="200"
                  image={imageUrl}
                  alt={product.title}
                  sx={{
                     objectFit: 'cover',
                     borderRadius: 1,
                     bgcolor: 'background.neutral',
                  }}
               />

               {/* Product Info */}
               <Box>
                  <Typography variant="h6" gutterBottom>
                     {product.title}
                  </Typography>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                     {fCurrency(product.sale_price || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                     <Typography variant="body2" color="text.secondary">
                        Stock tersedia:
                     </Typography>
                     <Chip
                        label={`${currentStock} pcs`}
                        size="small"
                        color={currentStock > 0 ? 'success' : 'error'}
                        variant="outlined"
                     />
                  </Box>
               </Box>

               {/* Quantity Controls */}
               <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                     Quantity
                  </Typography>
                  <Box
                     sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                     }}
                  >
                     <IconButton
                        size="small"
                        onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                        disabled={qty <= 1}
                        sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                     >
                        <Iconify icon="solar:minus-circle-bold" width={20} />
                     </IconButton>

                     <Typography
                        variant="h6"
                        sx={{ minWidth: 60, textAlign: 'center', fontWeight: 600 }}
                     >
                        {qty}
                     </Typography>

                     <IconButton
                        size="small"
                        onClick={() => {
                           setQty((prev) => prev + 1);
                           setStockError('');
                        }}
                        sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                     >
                        <Iconify icon="solar:add-circle-bold" width={20} />
                     </IconButton>
                  </Box>
               </Box>

               {/* Stock Error Alert */}
               {stockError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                     {stockError}
                  </Alert>
               )}

               {/* Subtotal */}
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
                  <Typography variant="subtitle1">Subtotal:</Typography>
                  <Typography variant="h6" color="primary.main">
                     {fCurrency(subtotal)}
                  </Typography>
               </Box>
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} variant="outlined" color="inherit">
               Cancel
            </Button>
            <Button onClick={handleAddToCart} variant="contained" disabled={loading || qty <= 0}>
               {loading ? 'Adding...' : 'Add to Cart'}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
