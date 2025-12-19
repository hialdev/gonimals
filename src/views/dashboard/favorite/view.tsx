'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/al/paths';

import useProductStore from 'src/stores/product';
import useFavoriteStore from 'src/stores/favorite';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductCard } from '../catalog/components/product-card';
import { AddToCartModal } from '../catalog/components/add-to-cart-modal';
import type { Product } from 'src/types/product';
import { useBoolean } from 'minimal-shared/hooks';

// ----------------------------------------------------------------------

export function FavoriteView() {
   const addToCartModal = useBoolean();

   const { products, getCatalog: getProducts } = useProductStore();
   const { favorites } = useFavoriteStore();

   const [loading, setLoading] = useState<boolean>(true);
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

   const fetchProducts = async () => {
      setLoading(true);
      try {
         const params = {
            limit: 100,
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

   // Filter products to show only favorites
   const favoriteProducts = products.filter((product) => favorites.includes(product.id!));

   return (
      <>
         <DashboardContent>
            <CustomBreadcrumbs
               heading="Favorite Products"
               links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Favorite' }]}
               sx={{ mb: { xs: 3, md: 5 } }}
            />

            {loading ? (
               <LoadingScreen />
            ) : (
               <>
                  {favoriteProducts.length === 0 ? (
                     <Card sx={{ p: 8, textAlign: 'center' }}>
                        <Iconify
                           icon="solar:heart-bold-duotone"
                           width={80}
                           sx={{ color: 'text.disabled', mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary">
                           Belum ada produk favorit
                        </Typography>
                     </Card>
                  ) : (
                     <Grid container spacing={3}>
                        {favoriteProducts.map((product) => (
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

         {/* Add to Cart Modal */}
         {selectedProduct && (
            <AddToCartModal
               open={addToCartModal.value}
               onClose={handleCloseAddToCart}
               product={selectedProduct}
            />
         )}
      </>
   );
}
