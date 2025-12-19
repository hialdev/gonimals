'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/al/paths';
import { CONFIG } from 'src/global-config';

import useCartStore from 'src/stores/cart';
import useOrderStore from 'src/stores/order';
import useAuthStore from 'src/stores/auth';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

const CheckoutSchema = z.object({
   address_receiver: z.string().min(1, { message: 'Address is required!' }),
   phone_receiver: z.string().min(1, { message: 'Phone number is required!' }),
   notes: z.string().optional(),
});

type CheckoutFormType = z.infer<typeof CheckoutSchema>;

// ----------------------------------------------------------------------

export function CheckoutView() {
   const router = useRouter();
   const { items, getTotalPrice, clearCart, validateAllStock } = useCartStore();
   const { checkout } = useOrderStore();
   // Auth store no longer needed for ID access in payload

   const [loading, setLoading] = useState<boolean>(false);

   const totalPrice = getTotalPrice();

   const methods = useForm<CheckoutFormType>({
      resolver: zodResolver(CheckoutSchema),
      defaultValues: {
         address_receiver: '',
         phone_receiver: '',
         notes: '',
      },
   });

   const {
      handleSubmit,
      formState: { isSubmitting },
   } = methods;

   const onSubmit = handleSubmit(async (data) => {
      if (items.length === 0) {
         toast.error('Keranjang kosong');
         return;
      }

      setLoading(true);

      try {
         // Validate stock one more time before creating order
         const validations = await validateAllStock();
         const hasInvalidStock = validations.some((v) => !v.isValid);

         if (hasInvalidStock) {
            const errors = validations
               .filter((v) => !v.isValid)
               .map(
                  (v) =>
                     `${v.productTitle}: Stock tersedia ${v.availableStock}, diminta ${v.requestedQty}`
               );

            toast.error(
               <div>
                  <div>Stock telah berubah:</div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                     {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                     ))}
                  </ul>
               </div>
            );
            setLoading(false);
            return;
         }

         // Create order
         const orderData = {
            // user_id handled by backend from JWT
            address_receiver: data.address_receiver,
            phone_receiver: data.phone_receiver,
            notes: data.notes || '',
            products: items.map((item) => ({
               product_id: item.product.id!,
               qty: item.qty,
            })),
         };

         const response = await checkout({ data: orderData as any });

         if (response.success && response.data) {
            toast.success('Order berhasil dibuat');
            clearCart();
            // Redirect to payment page
            router.push(paths.dashboard.customer_orders.payment(response.data.id));
         } else {
            toast.error(response.message || 'Gagal membuat order');
         }
      } catch (error: any) {
         toast.error(error.message || 'Gagal membuat order');
      }

      setLoading(false);
   });

   if (items.length === 0) {
      return (
         <DashboardContent>
            <CustomBreadcrumbs
               heading="Checkout"
               links={[
                  { name: 'Dashboard', href: paths.dashboard.root },
                  { name: 'Catalog', href: paths.dashboard.customer_orders.catalog },
                  { name: 'Checkout' },
               ]}
               sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card sx={{ p: 8, textAlign: 'center' }}>
               <Iconify
                  icon="solar:cart-large-2-bold-duotone"
                  width={80}
                  sx={{ color: 'text.disabled', mb: 2 }}
               />
               <Typography variant="h6" color="text.secondary" gutterBottom>
                  Keranjang kosong
               </Typography>
               <Button
                  variant="contained"
                  onClick={() => router.push(paths.dashboard.customer_orders.catalog)}
                  sx={{ mt: 2 }}
               >
                  Kembali ke Catalog
               </Button>
            </Card>
         </DashboardContent>
      );
   }

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Checkout"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Catalog', href: paths.dashboard.customer_orders.catalog },
               { name: 'Checkout' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Form methods={methods} onSubmit={onSubmit}>
            <Grid container spacing={3}>
               {/* Order Summary */}
               <Grid size={{ xs: 12, md: 8 }}>
                  <Card sx={{ p: 3 }}>
                     <Typography variant="h6" gutterBottom>
                        Order Summary
                     </Typography>

                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
                                 <CardMedia
                                    component="img"
                                    image={imageUrl}
                                    alt={item.product.title}
                                    sx={{
                                       width: 80,
                                       height: 80,
                                       objectFit: 'cover',
                                       borderRadius: 1,
                                       bgcolor: 'background.neutral',
                                    }}
                                 />

                                 <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle1">
                                       {item.product.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                       {fCurrency(item.product.sale_price || 0)} x {item.qty}
                                    </Typography>
                                 </Box>

                                 <Typography variant="h6" color="primary.main">
                                    {fCurrency(subtotal)}
                                 </Typography>
                              </Box>
                           );
                        })}
                     </Box>

                     <Divider sx={{ my: 3 }} />

                     <Box
                        sx={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                        }}
                     >
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h5" color="primary.main">
                           {fCurrency(totalPrice)}
                        </Typography>
                     </Box>
                  </Card>
               </Grid>

               {/* Delivery Information */}
               <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3 }}>
                     <Typography variant="h6" gutterBottom>
                        Delivery Information
                     </Typography>

                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <Field.Text
                           name="address_receiver"
                           label="Delivery Address"
                           multiline
                           rows={3}
                           required
                        />

                        <Field.Text name="phone_receiver" label="Phone Number" required />

                        <Field.Text name="notes" label="Notes (Optional)" multiline rows={2} />
                     </Box>

                     <Divider sx={{ my: 3 }} />

                     <LoadingButton
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        loading={isSubmitting || loading}
                        startIcon={<Iconify icon="solar:card-send-bold" />}
                     >
                        Process Order
                     </LoadingButton>

                     <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        onClick={() => router.push(paths.dashboard.customer_orders.catalog)}
                        sx={{ mt: 1 }}
                     >
                        Back to Catalog
                     </Button>
                  </Card>
               </Grid>
            </Grid>
         </Form>
      </DashboardContent>
   );
}
