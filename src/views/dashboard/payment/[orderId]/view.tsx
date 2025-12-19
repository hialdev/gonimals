'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';

import { paths } from 'src/routes/al/paths';

import useOrderStore from 'src/stores/order';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function PaymentView() {
   const params = useParams();
   const router = useRouter();
   const orderId = params.orderId as string;

   const { getMyOrder } = useOrderStore();

   const [loading, setLoading] = useState<boolean>(true);
   const [order, setOrder] = useState<any>(null);

   const fetchOrder = async () => {
      setLoading(true);
      try {
         const res = await getMyOrder({ id: orderId });
         if (res.success && res.data) {
            setOrder(res.data);
         } else {
            toast.error('Gagal memuat data pesanan');
         }
      } catch (error) {
         toast.error('Gagal memuat data pesanan');
      }
      setLoading(false);
   };

   useEffect(() => {
      if (orderId) {
         fetchOrder();
      }
   }, [orderId]);

   if (loading) {
      return (
         <DashboardContent>
            <LoadingScreen />
         </DashboardContent>
      );
   }

   if (!order) {
      return (
         <DashboardContent>
            <Card sx={{ p: 8, textAlign: 'center' }}>
               <Typography variant="h6" color="text.secondary">
                  Pesanan tidak ditemukan
               </Typography>
               <Button
                  variant="contained"
                  onClick={() => router.push(paths.dashboard.customer_orders.my_orders)}
                  sx={{ mt: 2 }}
               >
                  Kembali ke My Orders
               </Button>
            </Card>
         </DashboardContent>
      );
   }

   const statusColor = {
      waiting_payment: 'warning',
      on_progress: 'info',
      finish: 'success',
   } as const;

   const statusLabel = {
      waiting_payment: 'Waiting Payment',
      on_progress: 'On Progress',
      finish: 'Finish',
   } as const;

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Payment"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'My Orders', href: paths.dashboard.customer_orders.my_orders },
               { name: 'Payment' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Card sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            {/* Order Info */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
               <Typography variant="h5" gutterBottom>
                  Order #{order.order_number}
               </Typography>
               <Chip
                  label={statusLabel[order.status || 'waiting_payment']}
                  color={statusColor[order.status || 'waiting_payment']}
                  size="medium"
                  variant="soft"
               />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Total Amount */}
            <Box
               sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 3,
                  bgcolor: 'background.neutral',
                  borderRadius: 2,
                  mb: 3,
               }}
            >
               <Typography variant="h6">Total Pembayaran:</Typography>
               <Typography variant="h4" color="primary.main">
                  {fCurrency(order.total_bill || 0)}
               </Typography>
            </Box>

            {/* Payment Instructions */}
            {order.status === 'waiting_payment' && order.xendit_invoice_url && (
               <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                     Metode Pembayaran
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                     Silakan lakukan pembayaran melalui Xendit dengan klik tombol di bawah:
                  </Typography>

                  <Button
                     fullWidth
                     variant="contained"
                     size="large"
                     href={order.xendit_invoice_url}
                     target="_blank"
                     rel="noopener noreferrer"
                     startIcon={<Iconify icon="solar:card-send-bold" />}
                     sx={{ mb: 2 }}
                  >
                     Bayar Sekarang
                  </Button>

                  <Box
                     sx={{
                        p: 2,
                        bgcolor: 'info.lighter',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'info.light',
                     }}
                  >
                     <Typography variant="caption" color="info.darker">
                        <strong>Catatan:</strong> Setelah pembayaran berhasil, status pesanan akan
                        otomatis berubah menjadi "On Progress"
                     </Typography>
                  </Box>
               </Box>
            )}

            {/* Payment Success */}
            {order.status === 'on_progress' && (
               <Box
                  sx={{
                     p: 3,
                     bgcolor: 'success.lighter',
                     borderRadius: 2,
                     textAlign: 'center',
                     mb: 3,
                  }}
               >
                  <Iconify
                     icon="solar:check-circle-bold"
                     width={64}
                     sx={{ color: 'success.main', mb: 2 }}
                  />
                  <Typography variant="h6" color="success.darker" gutterBottom>
                     Pembayaran Berhasil!
                  </Typography>
                  <Typography variant="body2" color="success.darker">
                     Pesanan Anda sedang diproses
                  </Typography>
               </Box>
            )}

            {/* Order Finished */}
            {order.status === 'finish' && (
               <Box
                  sx={{
                     p: 3,
                     bgcolor: 'success.lighter',
                     borderRadius: 2,
                     textAlign: 'center',
                     mb: 3,
                  }}
               >
                  <Iconify
                     icon="solar:verified-check-bold"
                     width={64}
                     sx={{ color: 'success.main', mb: 2 }}
                  />
                  <Typography variant="h6" color="success.darker" gutterBottom>
                     Pesanan Selesai
                  </Typography>
                  <Typography variant="body2" color="success.darker">
                     Terima kasih atas pesanan Anda!
                  </Typography>
               </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
               <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => router.push(paths.dashboard.customer_orders.my_orders)}
               >
                  Lihat Pesanan Saya
               </Button>
               <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => router.push(paths.dashboard.customer_orders.catalog)}
               >
                  Belanja Lagi
               </Button>
            </Box>
         </Card>
      </DashboardContent>
   );
}
