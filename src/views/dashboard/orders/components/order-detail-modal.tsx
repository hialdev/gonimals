import type { Order } from 'src/types/order';
import type { OrderLogStatusData } from 'src/stores/order-log-status';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
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
import useOrderLogStatusStore from 'src/stores/order-log-status';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   order: Order;
};

export function OrderDetailModal({ open, onClose, order }: Props) {
   const { logs, getByOrderId } = useOrderLogStatusStore();
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (open && order.id) {
         fetchLogs();
      }
   }, [open, order.id]);

   const fetchLogs = async () => {
      setLoading(true);
      try {
         await getByOrderId({ orderId: order.id! });
      } catch (error) {
         console.error('Failed to fetch logs:', error);
      } finally {
         setLoading(false);
      }
   };

   const statusColor: Record<string, any> = {
      waiting_payment: 'warning',
      waiting_confirmation: 'info',
      on_progress: 'info',
      finish: 'success',
      stock_issue: 'error',
      waiting_restock: 'info',
      refund_pending: 'warning',
      refunded: 'error',
      canceled: 'error',
   };

   const statusLabel: Record<string, string> = {
      waiting_payment: 'Waiting Payment',
      waiting_confirmation: 'Waiting Confirmation',
      on_progress: 'On Progress',
      finish: 'Finished',
      stock_issue: 'Stock Issue',
      waiting_restock: 'Waiting Restock',
      refund_pending: 'Refund Pending',
      refunded: 'Refunded',
      canceled: 'Canceled',
   };

   const parseImages = (imagesStr?: string): string[] => {
      if (!imagesStr) return [];
      try {
         return JSON.parse(imagesStr);
      } catch {
         return [];
      }
   };

   return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Typography variant="h6">Order Details</Typography>
               <IconButton onClick={onClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
               {/* Order Info */}
               <Card variant="outlined">
                  <CardContent>
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'start',
                           }}
                        >
                           <Box>
                              <Typography variant="caption" color="text.secondary">
                                 Order Number
                              </Typography>
                              <Typography variant="h6">{order.order_number}</Typography>
                           </Box>
                           <Chip
                              label={statusLabel[order.status || 'waiting_payment']}
                              color={statusColor[order.status || 'waiting_payment']}
                              size="small"
                           />
                        </Box>

                        <Box>
                           <Typography variant="caption" color="text.secondary">
                              Customer
                           </Typography>
                           <Typography variant="body2">{order.phone_receiver}</Typography>
                           <Typography variant="body2" color="text.secondary">
                              {order.address_receiver}
                           </Typography>
                        </Box>

                        <Box>
                           <Typography variant="caption" color="text.secondary">
                              Total Bill
                           </Typography>
                           <Typography variant="h6" color="primary.main">
                              {fCurrency(order.total_bill || 0)}
                           </Typography>
                        </Box>
                     </Box>
                  </CardContent>
               </Card>

               {/* Products */}
               <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                     Products
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                     {order.order_products?.map((item) => (
                        <Card key={item.id} variant="outlined">
                           <CardContent sx={{ py: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                 <Typography variant="body2">{item.product?.title}</Typography>
                                 <Typography variant="body2">
                                    {fCurrency(item.price_at_order || 0)} × {item.qty}
                                 </Typography>
                              </Box>
                           </CardContent>
                        </Card>
                     ))}
                  </Box>
               </Box>

               {/* Timeline */}
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
                                    <TimelineDot color={statusColor[log.status || 'default']} />
                                    {!isLast && <TimelineConnector />}
                                 </TimelineSeparator>

                                 <TimelineContent>
                                    <Card variant="outlined" sx={{ mb: 2 }}>
                                       <CardContent>
                                          <Chip
                                             label={statusLabel[log.status || 'Unknown']}
                                             color={statusColor[log.status || 'default']}
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

                                          {log.created_by && (
                                             <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                sx={{ mt: 1 }}
                                             >
                                                By: Admin
                                             </Typography>
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
      </Dialog>
   );
}
