import type { Order } from 'src/types/order';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/al/paths';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   order: Order;
   onRefund: () => void;
   onWaitRestock: () => void;
};

export function StockIssueModal({ open, onClose, order, onRefund, onWaitRestock }: Props) {
   const router = useRouter();
   const [loading, setLoading] = useState(false);

   // Parse stock errors from notes
   const getStockErrors = () => {
      try {
         if (order.notes && order.notes.includes('Details:')) {
            const jsonStr = order.notes.split('Details: ')[1];
            return JSON.parse(jsonStr) as string[];
         }
      } catch (e) {
         console.error('Failed to parse stock errors:', e);
      }
      return [];
   };

   const stockErrors = getStockErrors();

   const handleRefund = async () => {
      setLoading(true);
      await onRefund();
      setLoading(false);
   };

   const handleWaitRestock = async () => {
      setLoading(true);
      await onWaitRestock();
      setLoading(false);
   };

   const handleShop = () => {
      router.push(paths.dashboard.customer_orders.catalog);
      onClose();
   };

   return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:danger-triangle-bold" width={32} color="error.main" />
                  <Typography variant="h5">Order Telah Dibayar</Typography>
               </Box>
               <IconButton onClick={onClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
               {/* Alert */}
               <Alert severity="warning" sx={{ fontSize: '1rem' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Stock Tidak Mencukupi
                  </Typography>
                  <Typography variant="body2">
                     Pembayaran Anda telah diterima, namun ada beberapa produk yang stock-nya tidak
                     mencukupi. Silakan pilih tindakan yang Anda inginkan.
                  </Typography>
               </Alert>

               {/* Order Info */}
               <Box>
                  <Typography variant="caption" color="text.secondary">
                     Order Number
                  </Typography>
                  <Typography variant="h6">{order.order_number}</Typography>
               </Box>

               {/* Product List with Stock Issues */}
               <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Detail Produk
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                     {order.order_products?.map((item) => {
                        // Check if this product has stock issue
                        const hasStockIssue = stockErrors.some((error) =>
                           error.includes(item.product?.title || '')
                        );

                        // Extract available stock from error message
                        const stockError = stockErrors.find((error) =>
                           error.includes(item.product?.title || '')
                        );
                        let availableStock = 0;
                        if (stockError) {
                           const match = stockError.match(/available: (\d+)/);
                           if (match) {
                              availableStock = parseInt(match[1], 10);
                           }
                        }

                        return (
                           <Card
                              key={item.id}
                              sx={{
                                 border: hasStockIssue ? 2 : 1,
                                 borderColor: hasStockIssue ? 'error.main' : 'divider',
                                 bgcolor: hasStockIssue ? 'error.lighter' : 'background.paper',
                              }}
                           >
                              <CardContent>
                                 <Box
                                    sx={{
                                       display: 'flex',
                                       justifyContent: 'space-between',
                                       alignItems: 'start',
                                    }}
                                 >
                                    <Box sx={{ flexGrow: 1 }}>
                                       <Typography variant="subtitle1" gutterBottom>
                                          {item.product?.title}
                                       </Typography>
                                       <Typography variant="body2" color="text.secondary">
                                          {fCurrency(item.price_at_order || 0)} × {item.qty}
                                       </Typography>

                                       {hasStockIssue && (
                                          <Box sx={{ mt: 1 }}>
                                             <Alert severity="error" sx={{ py: 0.5 }}>
                                                <Typography variant="caption">
                                                   <strong>Stock Tersedia: {availableStock}</strong>{' '}
                                                   | Permintaan: {item.qty}
                                                </Typography>
                                             </Alert>
                                          </Box>
                                       )}
                                    </Box>

                                    {hasStockIssue && (
                                       <Iconify
                                          icon="solar:danger-triangle-bold"
                                          width={24}
                                          color="error.main"
                                       />
                                    )}
                                 </Box>
                              </CardContent>
                           </Card>
                        );
                     })}
                  </Box>
               </Box>

               {/* Total */}
               <Box
                  sx={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     p: 2,
                     bgcolor: 'background.neutral',
                     borderRadius: 1,
                  }}
               >
                  <Typography variant="h6">Total Pembayaran:</Typography>
                  <Typography variant="h6" color="primary.main">
                     {fCurrency(order.total_bill || 0)}
                  </Typography>
               </Box>

               {/* Action Options */}
               <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Pilih Tindakan
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                     {/* Refund Option */}
                     <Card variant="outlined">
                        <CardContent>
                           <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                              <Iconify
                                 icon="solar:wallet-money-bold"
                                 width={32}
                                 color="warning.main"
                              />
                              <Box sx={{ flexGrow: 1 }}>
                                 <Typography variant="subtitle1" gutterBottom>
                                    Minta Refund
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                    Uang Anda akan dikembalikan dalam waktu 2x24 jam melalui proses
                                    manual oleh admin.
                                 </Typography>
                              </Box>
                           </Box>
                        </CardContent>
                     </Card>

                     {/* Wait Restock Option */}
                     <Card variant="outlined">
                        <CardContent>
                           <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                              <Iconify icon="solar:box-bold" width={32} color="info.main" />
                              <Box sx={{ flexGrow: 1 }}>
                                 <Typography variant="subtitle1" gutterBottom>
                                    Tunggu Restock
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                    Admin akan memeriksa pesanan Anda dalam 1x24 jam dan memberikan
                                    penanganan stock dalam 2x24 jam.
                                 </Typography>
                              </Box>
                           </Box>
                        </CardContent>
                     </Card>
                  </Box>
               </Box>
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
            <Button
               onClick={handleShop}
               variant="outlined"
               color="inherit"
               startIcon={<Iconify icon="solar:cart-large-2-bold" />}
            >
               Belanja Kembali
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
               onClick={handleWaitRestock}
               variant="outlined"
               color="info"
               disabled={loading}
               startIcon={<Iconify icon="solar:box-bold" />}
            >
               Tunggu Restock
            </Button>
            <Button
               onClick={handleRefund}
               variant="contained"
               color="warning"
               disabled={loading}
               startIcon={<Iconify icon="solar:wallet-money-bold" />}
            >
               {loading ? 'Processing...' : 'Minta Refund'}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
