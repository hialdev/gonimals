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

import { paths } from 'src/routes/al/paths';

import useCartStore from 'src/stores/cart';
import useProductStore from 'src/stores/product';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductCard } from './components/product-card';
import { CartModal } from './components/cart-modal';
import { AddToCartModal } from './components/add-to-cart-modal';

// ----------------------------------------------------------------------

export function CatalogView() {
   const cartModal = useBoolean();
   const addToCartModal = useBoolean();

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

   const cartItemCount = getItemCount();

   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   return (
      <>
         <DashboardContent>
            <CustomBreadcrumbs
               heading="Catalog"
               links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Catalog' }]}
               sx={{ mb: { xs: 3, md: 5 } }}
            />

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
                              />
                           </Grid>
                        ))}
                     </Grid>
                  )}
               </>
            )}
         </DashboardContent>

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
      </>
   );
}
