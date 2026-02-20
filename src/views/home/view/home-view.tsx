'use client';

import type { Product } from 'src/types/product';

import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import useCartStore from 'src/stores/cart';
import useProductStore from 'src/stores/product';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { ProductCard } from '../../dashboard/catalog/components/product-card';
import { CartModal } from '../../dashboard/catalog/components/cart-modal';
import { AddToCartModal } from '../../dashboard/catalog/components/add-to-cart-modal';
import { ReviewListModal } from '../../dashboard/catalog/components/review-list-modal';

// ----------------------------------------------------------------------

export function HomeView() {
   const cartModal = useBoolean();
   const addToCartModal = useBoolean();
   const reviewModal = useBoolean();

   const { products, getCatalog: getProducts } = useProductStore();
   const { getItemCount } = useCartStore();

   const [loading, setLoading] = useState<boolean>(true);
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

   const fetchProducts = async () => {
      setLoading(true);
      try {
         const params = {
            limit: 100, // Show many products
         };
         const res = await getProducts(params);
         if (!res.success) {
            toast.error('Gagal memuat produk');
         }
      } catch (error) {
         toast.error('Gagal memuat produk');
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchProducts();
   }, []);

   const handleOpenAddToCart = (product: Product) => {
      setSelectedProduct(product);
      addToCartModal.onTrue();
   };

   const handleCloseAddToCart = () => {
      setSelectedProduct(null);
      addToCartModal.onFalse();
   };

   const handleViewReviews = (product: Product) => {
      setSelectedProduct(product);
      reviewModal.onTrue();
   };

   const cartItemCount = getItemCount();
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   return (
      <>
         <Box
            sx={{
               py: { xs: 10, md: 15 },
               px: 3,
               mb: 8,
               bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
               textAlign: 'center',
            }}
         >
            <Typography variant="h2" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
               Belanja Hewan Qurban & Ternak diujung jari!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
               Jelajahi koleksi hewan dan produk terbaik kami. Nikmati kemudahan berbelanja dengan
               pelayanan terbaik hanya untuk Anda.
            </Typography>
         </Box>

         <Container maxWidth="xl" sx={{ mb: 10 }}>
            {loading ? (
               <LoadingScreen />
            ) : (
               <>
                  {products.length === 0 ? (
                     <Card sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                           Tidak ada produk tersedia
                        </Typography>
                     </Card>
                  ) : (
                     <Grid container spacing={3}>
                        {products.map((product) => (
                           <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                              <ProductCard
                                 product={product}
                                 onAddToCart={() => handleOpenAddToCart(product)}
                                 onViewReviews={() => handleViewReviews(product)}
                              />
                           </Grid>
                        ))}
                     </Grid>
                  )}
               </>
            )}
         </Container>

         {/* Floating Cart Button */}
         <Fab
            color="primary"
            aria-label="cart"
            onClick={cartModal.onTrue}
            sx={{
               position: 'fixed',
               bottom: 24,
               right: 24,
               zIndex: 1000,
            }}
         >
            <Badge badgeContent={mounted ? cartItemCount : 0} color="error">
               <Iconify icon="solar:cart-large-2-bold" width={24} />
            </Badge>
         </Fab>

         {/* Add to Cart Modal */}
         {selectedProduct && (
            <AddToCartModal
               open={addToCartModal.value}
               onClose={handleCloseAddToCart}
               product={selectedProduct}
            />
         )}

         {/* Cart Modal */}
         <CartModal open={cartModal.value} onClose={cartModal.onFalse} />

         {/* Review Modal */}
         <ReviewListModal
            open={reviewModal.value}
            onClose={reviewModal.onFalse}
            productId={selectedProduct?.id || null}
            productTitle={selectedProduct?.title}
         />
      </>
   );
}
