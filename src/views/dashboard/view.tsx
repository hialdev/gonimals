'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/al/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { LoadingScreen } from 'src/components/loading-screen';

// Import stores for each model
import useUserStore from 'src/stores/user';
import useOrderStore from 'src/stores/order';
import useSettingStore from 'src/stores/setting';
import useProductStore from 'src/stores/product';
import usePurchaseStore from 'src/stores/purchase';
import usePrincipleStore from 'src/stores/principle';
import useAdjustmentStore from 'src/stores/adjustment';
import useProductTypeStore from 'src/stores/product-type';
import useStockMovementStore from 'src/stores/stock-movement';
import useFavoriteStore from 'src/stores/favorite';

import useAuthStore from 'src/stores/auth';

// ----------------------------------------------------------------------

type WidgetItem = {
   title: string;
   path: string;
   icon: string;
   count: number;
   color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
   permission?: string;
};

// ----------------------------------------------------------------------

export function DashboardView() {
   const [loading, setLoading] = useState(true);
   const [widgets, setWidgets] = useState<WidgetItem[]>([]);

   // Initialize stores
   const userStore = useUserStore();
   const orderStore = useOrderStore();
   const settingStore = useSettingStore();
   const productStore = useProductStore();
   const purchaseStore = usePurchaseStore();
   const principleStore = usePrincipleStore();
   const adjustmentStore = useAdjustmentStore();
   const productTypeStore = useProductTypeStore();
   const stockMovementStore = useStockMovementStore();
   const favoriteStore = useFavoriteStore();

   const { user, authData } = useAuthStore();

   const checkPermission = (permission?: string) => {
      if (!permission) return true;
      const userPermissions = user?.permissions || authData?.permissions || [];
      return userPermissions.includes(permission);
   };

   useEffect(() => {
      const fetchData = async () => {
         setLoading(true);

         // Define all potential widgets based on nav-config-dashboard
         const potentialWidgets: (Omit<WidgetItem, 'count'> & { fetch: () => Promise<any> })[] = [
            {
               title: 'Orders',
               path: paths.dashboard.orders.root,
               icon: 'solar:bag-4-bold-duotone',
               color: 'info',
               permission: 'Read Order',
               fetch: () =>
                  orderStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Product Types',
               path: paths.dashboard.product_types.root,
               icon: 'solar:tag-bold-duotone',
               color: 'success',
               permission: 'Read ProductType',
               fetch: () =>
                  productTypeStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Products',
               path: paths.dashboard.products.root,
               icon: 'solar:box-bold-duotone',
               color: 'success',
               permission: 'Read Product',
               fetch: () =>
                  productStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Principles',
               path: paths.dashboard.principles.root,
               icon: 'solar:users-group-two-rounded-bold-duotone',
               color: 'warning',
               permission: 'Read Principle',
               fetch: () =>
                  principleStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Purchases',
               path: paths.dashboard.purchases.root,
               icon: 'solar:cart-large-2-bold-duotone',
               color: 'info',
               permission: 'Read Purchase',
               fetch: () =>
                  purchaseStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Adjustments',
               path: paths.dashboard.adjustments.root,
               icon: 'solar:slider-vertical-bold-duotone',
               color: 'error',
               permission: 'Read Adjustment',
               fetch: () =>
                  adjustmentStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Stock Movements',
               path: paths.dashboard.stock_movements.root,
               icon: 'solar:history-bold-duotone',
               color: 'info',
               permission: 'Read StockMovement',
               fetch: () =>
                  stockMovementStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Users',
               path: paths.dashboard.users.root,
               icon: 'solar:user-bold-duotone',
               color: 'warning',
               permission: 'Read User',
               fetch: () => userStore.all({ page: 1, limit: 1, sort: 'created_at', order: 'desc' }),
            },
            {
               title: 'Settings',
               path: paths.dashboard.settings,
               icon: 'solar:settings-minimalistic-bold-duotone',
               color: 'error',
               permission: 'Read Setting',
               fetch: () => settingStore.all(),
            },
            // Customer Widgets
            {
               title: 'Catalog',
               path: paths.dashboard.customer_orders.catalog,
               icon: 'solar:shop-bold-duotone',
               color: 'info',
               // Open for all authenticated
               fetch: () => productStore.getCatalog({ page: 1, limit: 1 }),
            },
            {
               title: 'My Orders',
               path: paths.dashboard.customer_orders.my_orders,
               icon: 'solar:clipboard-list-bold-duotone',
               color: 'success',
               // Open for all authenticated
               fetch: () => orderStore.getMyOrders({ page: 1, limit: 1 }),
            },
            {
               title: 'Favorite',
               path: paths.dashboard.customer_orders.favorite,
               icon: 'solar:heart-bold-duotone',
               color: 'error',
               // Open for all authenticated
               fetch: async () => ({ data: { length: favoriteStore.favorites.length } }),
            },
         ];

         // Filter widgets based on permissions
         const visibleWidgets = potentialWidgets.filter((w) => checkPermission(w.permission));

         // Fetch data only for visible widgets
         const responses = await Promise.allSettled(visibleWidgets.map((w) => w.fetch()));

         const widgetsData: WidgetItem[] = visibleWidgets.map((w, index) => {
            const response = responses[index];
            let count = 0;

            if (response.status === 'fulfilled') {
               // Handle different response structures
               if (response.value?.data?.pagination?.total !== undefined) {
                  count = response.value.data.pagination.total;
               } else if (response.value?.data?.length !== undefined) {
                  count = response.value.data.length;
               } else if (Array.isArray(response.value)) {
                  count = response.value.length;
               }
            }

            return {
               title: w.title,
               path: w.path,
               icon: w.icon,
               color: w.color,
               permission: w.permission,
               count,
            };
         });

         setWidgets(widgetsData);
         setLoading(false);
      };

      fetchData();
   }, [user, authData]);

   if (loading) {
      return <LoadingScreen />;
   }

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Dashboard"
            links={[{ name: 'Dashboard', href: paths.dashboard.root }]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Grid container spacing={3}>
            {widgets.map((widget, index) => (
               <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                  <Link href={widget.path} underline="none">
                     <Card
                        sx={{
                           height: '100%',
                           display: 'flex',
                           flexDirection: 'column',
                           transition: 'transform 0.3s, box-shadow 0.3s',
                           '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: (theme) => theme.shadows[10],
                           },
                        }}
                     >
                        <CardContent>
                           <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                           >
                              <Stack spacing={1}>
                                 <Typography variant="h6" component="div">
                                    {widget.title}
                                 </Typography>
                                 <Typography variant="h4" component="div">
                                    {widget.count}
                                 </Typography>
                              </Stack>
                              <Avatar
                                 sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: `${widget.color}.main`,
                                    color: 'white',
                                 }}
                              >
                                 <Iconify icon={widget.icon} width={28} />
                              </Avatar>
                           </Stack>
                           <Box sx={{ mt: 2 }}>
                              <Chip
                                 label="View Details"
                                 icon={<Iconify icon="solar:alt-arrow-right-outline" />}
                                 variant="soft"
                                 size="small"
                              />
                           </Box>
                        </CardContent>
                     </Card>
                  </Link>
               </Grid>
            ))}
         </Grid>
      </DashboardContent>
   );
}
