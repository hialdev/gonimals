import type { Order } from 'src/types/order';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';
import { CONFIG } from 'src/global-config';
// import useOrderLogStatusStore from 'src/stores/order-log-status';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   order: Order;
};

export function OrderDetailModal({ open, onClose, order }: Props) {
   const logs = order.order_logs || [];
   const loading = false; // Data is preloaded now

   // Removed fetchLogs and store usage since data is passed via props

   const statusColor = {
      waiting_payment: 'warning',
      on_progress: 'info',
      finish: 'success',
      stock_issue: 'error',
      waiting_restock: 'info',
      refund_pending: 'warning',
      refunded: 'error',
      canceled: 'error',
   } as const;

   const statusLabel = {
      waiting_payment: 'Waiting Payment',
      on_progress: 'On Progress',
      finish: 'Finished',
      stock_issue: 'Stock Issue',
      waiting_restock: 'Waiting Restock',
      refund_pending: 'Refund Pending',
      refunded: 'Refunded',
      canceled: 'Canceled',
   } as const;

   const parseImages = (imagesStr?: string): string[] => {
      if (!imagesStr) return [];
      try {
         return JSON.parse(imagesStr);
      } catch {
         return [];
      }
   };

   const handleOpenInvoice = () => {
      if (order.xendit_invoice_url) {
         window.open(order.xendit_invoice_url, '_blank');
      }
   };

   return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Typography variant="h5">Order Details</Typography>
               <IconButton onClick={onClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
               {/* Order Info */}
               <Box>
                  <Typography variant="overline" color="text.secondary">
                     Order Number
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                     {order.order_number}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                     <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                           Date
                        </Typography>
                        <Typography variant="body2">
                           {order.created_at
                              ? dayjs(order.created_at).format('DD MMM YYYY HH:mm')
                              : '-'}
                        </Typography>
                     </Box>

                     <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                           Status
                        </Typography>
                        <Chip
                           label={statusLabel[order.status || 'waiting_payment']}
                           color={statusColor[order.status || 'waiting_payment']}
                           size="small"
                           variant="soft"
                        />
                     </Box>
                  </Box>
               </Box>

               <Divider />

               {/* Receiver Information */}
               <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Receiver Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                     <Box sx={{ display: 'flex', gap: 1 }}>
                        <Iconify icon="solar:map-point-bold" width={20} />
                        <Typography variant="body2">{order.address_receiver || '-'}</Typography>
                     </Box>
                     <Box sx={{ display: 'flex', gap: 1 }}>
                        <Iconify icon="solar:phone-bold" width={20} />
                        <Typography variant="body2">{order.phone_receiver || '-'}</Typography>
                     </Box>
                  </Box>
               </Box>

               {/* Notes */}
               {order.notes && (
                  <>
                     <Divider />
                     <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                           Notes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                           {order.notes}
                        </Typography>
                     </Box>
                  </>
               )}

               <Divider />

               {/* Products */}
               <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Order Items
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                     {order.order_products?.map((item) => {
                        const imageUrl = item.product?.image
                           ? `${process.env.NEXT_PUBLIC_API_HOST}/${item.product.image}`
                           : '/assets/placeholder.svg';

                        const subtotal = (item.price_at_order || 0) * (item.qty || 0);

                        return (
                           <Box
                              key={item.id}
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
                                 alt={item.product?.title}
                                 sx={{
                                    width: 80,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    bgcolor: 'background.neutral',
                                 }}
                              />

                              {/* Product Info */}
                              <Box sx={{ flexGrow: 1 }}>
                                 <Typography variant="subtitle2" gutterBottom>
                                    {item.product?.title}
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {fCurrency(item.price_at_order || 0)} × {item.qty}
                                 </Typography>
                              </Box>

                              {/* Subtotal */}
                              <Box sx={{ textAlign: 'right' }}>
                                 <Typography variant="subtitle2" color="primary.main">
                                    {fCurrency(subtotal)}
                                 </Typography>
                              </Box>
                           </Box>
                        );
                     })}
                  </Box>
               </Box>

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
                  <Typography variant="h6">Total Bill:</Typography>
                  <Typography variant="h5" color="primary.main">
                     {fCurrency(order.total_bill || 0)}
                  </Typography>
               </Box>

               {/* Payment Information */}
               {order.status === 'waiting_payment' && order.xendit_invoice_url && (
                  <Box
                     sx={{
                        p: 2,
                        bgcolor: 'warning.lighter',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'warning.main',
                     }}
                  >
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Iconify icon="solar:card-send-bold" width={24} color="warning.main" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                           Payment Required
                        </Typography>
                     </Box>
                     <Typography variant="body2" color="text.secondary" gutterBottom>
                        Please complete your payment to process this order.
                     </Typography>
                     <Button
                        variant="contained"
                        color="warning"
                        onClick={handleOpenInvoice}
                        startIcon={<Iconify icon="solar:link-bold" />}
                        sx={{ mt: 1 }}
                     >
                        Open Payment Page
                     </Button>
                  </Box>
               )}

               <Divider />

               {/* Status Timeline */}
               <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Status Timeline
                  </Typography>

                  {loading ? (
                     <Typography variant="body2" color="text.secondary">
                        Loading timeline...
                     </Typography>
                  ) : logs.length === 0 ? (
                     <Typography variant="body2" color="text.secondary">
                        No status history available
                     </Typography>
                  ) : (
                     <Timeline position="right">
                        {logs.map((log, index) => {
                           const images = parseImages(log.images);
                           const isLast = index === logs.length - 1;

                           return (
                              <TimelineItem key={log.id}>
                                 <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                                    <Typography variant="caption">
                                       {dayjs(log.created_at).format('DD MMM YYYY')}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                       {dayjs(log.created_at).format('HH:mm')}
                                    </Typography>
                                 </TimelineOppositeContent>

                                 <TimelineSeparator>
                                    <TimelineDot
                                       color={
                                          statusColor[log.status as keyof typeof statusColor] ||
                                          'default'
                                       }
                                    />
                                    {!isLast && <TimelineConnector />}
                                 </TimelineSeparator>

                                 <TimelineContent>
                                    <Card variant="outlined" sx={{ mb: 2 }}>
                                       <CardContent>
                                          <Chip
                                             label={
                                                statusLabel[
                                                   log.status as keyof typeof statusLabel
                                                ] || 'Unknown'
                                             }
                                             color={
                                                statusColor[
                                                   log.status as keyof typeof statusColor
                                                ] || 'default'
                                             }
                                             size="small"
                                             sx={{ mb: 1 }}
                                          />
                                          <Typography variant="body2" sx={{ mb: 1 }}>
                                             {log.reason}
                                          </Typography>

                                          {images.length > 0 && (
                                             <Box
                                                sx={{
                                                   display: 'flex',
                                                   gap: 1,
                                                   flexWrap: 'wrap',
                                                   mt: 1,
                                                }}
                                             >
                                                {images.map((img, idx) => (
                                                   <Box
                                                      key={idx}
                                                      component="img"
                                                      src={`${CONFIG.apiHostUrl}/${img}`}
                                                      alt={`Proof ${idx + 1}`}
                                                      sx={{
                                                         width: 80,
                                                         height: 80,
                                                         objectFit: 'cover',
                                                         borderRadius: 1,
                                                         cursor: 'pointer',
                                                      }}
                                                      onClick={() =>
                                                         window.open(
                                                            `${CONFIG.apiHostUrl}/${img}`,
                                                            '_blank'
                                                         )
                                                      }
                                                   />
                                                ))}
                                             </Box>
                                          )}
                                       </CardContent>
                                    </Card>
                                 </TimelineContent>
                              </TimelineItem>
                           );
                        })}
                     </Timeline>
                  )}
               </Box>
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} variant="outlined" color="inherit">
               Close
            </Button>
         </DialogActions>
      </Dialog>
   );
}
