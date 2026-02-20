import type { Order } from 'src/types/order';

import { useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';
import useOrderStore from 'src/stores/order';

import { OrderDetailModal } from './order-detail-modal';
import { StockIssueModal } from './stock-issue-modal';
import { OrderReviewsModal } from '../../orders/components/order-reviews-modal';

// ----------------------------------------------------------------------

type Props = {
   row: Order;
   onActionSuccess?: () => void;
};

export function OrderTableRow({ row, onActionSuccess }: Props) {
   const [openDetailModal, setOpenDetailModal] = useState(false);
   const [openStockIssueModal, setOpenStockIssueModal] = useState(false);
   const [openReviewsModal, setOpenReviewsModal] = useState(false);

   const { requestRefund, waitRestock } = useOrderStore();

   const statusColor = {
      waiting_payment: 'warning',
      waiting_confirmation: 'info',
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
      waiting_confirmation: 'Waiting Confirmation',
      on_progress: 'On Progress',
      finish: 'Finish',
      stock_issue: 'Stock Issue',
      waiting_restock: 'Waiting Restock',
      refund_pending: 'Refund Pending',
      refunded: 'Refunded',
      canceled: 'Canceled',
   } as const;

   const handleOpenModal = () => {
      // If stock_issue, open stock issue modal instead
      if (row.status === 'stock_issue') {
         setOpenStockIssueModal(true);
      } else {
         setOpenDetailModal(true);
      }
   };

   const handleCloseDetailModal = () => {
      setOpenDetailModal(false);
   };

   const handleCloseStockIssueModal = () => {
      setOpenStockIssueModal(false);
   };

   const handleRefund = async () => {
      try {
         const response = await requestRefund({ id: row.id! });
         if (response.success) {
            toast.success(
               'Permintaan refund berhasil dikirim. Admin akan memproses dalam 2x24 jam.'
            );
            handleCloseStockIssueModal();
            // Trigger refetch from parent
            if (onActionSuccess) {
               onActionSuccess();
            }
         } else {
            toast.error(response.message || 'Gagal mengirim permintaan refund');
         }
      } catch (error) {
         toast.error('Terjadi kesalahan saat mengirim permintaan refund');
         console.error(error);
      }
   };

   const handleWaitRestock = async () => {
      try {
         const response = await waitRestock({ id: row.id! });
         if (response.success) {
            toast.success(
               'Permintaan tunggu restock berhasil. Admin akan memeriksa dalam 1x24 jam.'
            );
            handleCloseStockIssueModal();
            // Trigger refetch from parent
            if (onActionSuccess) {
               onActionSuccess();
            }
         } else {
            toast.error(response.message || 'Gagal mengirim permintaan');
         }
      } catch (error) {
         toast.error('Terjadi kesalahan saat mengirim permintaan');
         console.error(error);
      }
   };

   return (
      <>
         <TableRow hover>
            <TableCell>
               <Typography variant="subtitle2">{row.order_number}</Typography>
            </TableCell>

            <TableCell>
               {row.created_at ? dayjs(row.created_at).format('DD MMM YYYY HH:mm') : '-'}
            </TableCell>

            <TableCell>
               <Chip
                  label={statusLabel[row.status || 'waiting_payment']}
                  color={statusColor[row.status || 'waiting_payment']}
                  size="small"
                  variant="soft"
               />
            </TableCell>

            <TableCell>
               <Typography variant="subtitle2">{fCurrency(row.total_bill || 0)}</Typography>
            </TableCell>

            <TableCell align="right">
               {row.status === 'finish' && (
                  <IconButton onClick={() => setOpenReviewsModal(true)}>
                     <Iconify icon="solar:star-bold" sx={{ color: 'warning.main' }} />
                  </IconButton>
               )}
               <IconButton onClick={handleOpenModal}>
                  <Iconify icon="solar:eye-bold" />
               </IconButton>
            </TableCell>
         </TableRow>

         <OrderDetailModal open={openDetailModal} onClose={handleCloseDetailModal} order={row} />

         {row.status === 'stock_issue' && (
            <StockIssueModal
               open={openStockIssueModal}
               onClose={handleCloseStockIssueModal}
               order={row}
               onRefund={handleRefund}
               onWaitRestock={handleWaitRestock}
            />
         )}

         <OrderReviewsModal
            open={openReviewsModal}
            onClose={() => setOpenReviewsModal(false)}
            orderId={row.id!}
            orderNumber={row.order_number}
         />
      </>
   );
}
