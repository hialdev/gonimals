import type { Order } from 'src/types/order';

import { useState } from 'react';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';
import { usePopover } from 'minimal-shared/hooks';
import { CustomPopover } from 'src/components/custom-popover';
import useOrderStore from 'src/stores/order';

import { OrderDetailModal } from './order-detail-modal';
import { RefundModal } from './refund-modal';
import { CancelModal } from './cancel-modal';
import { ConfirmRestockModal } from './confirm-restock-modal';
import { DeliverModal } from './deliver-modal';
import { FinishModal } from './finish-modal';
import { ConfirmPaymentModal } from './confirm-payment-modal';
import { OrderReviewsModal } from './order-reviews-modal';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

type Props = {
   row: Order;
   onActionSuccess: () => void;
};

export function OrderTableRow({ row, onActionSuccess }: Props) {
   const popover = usePopover();
   const { confirmPayment, rejectPayment } = useOrderStore();
   const [openDetailModal, setOpenDetailModal] = useState(false);
   const [openRefundModal, setOpenRefundModal] = useState(false);
   const [openCancelModal, setOpenCancelModal] = useState(false);
   const [openRestockModal, setOpenRestockModal] = useState(false);
   const [openDeliverModal, setOpenDeliverModal] = useState(false);
   const [openFinishModal, setOpenFinishModal] = useState(false);
   const [openConfirmPaymentModal, setOpenConfirmPaymentModal] = useState(false);
   const [openReviewsModal, setOpenReviewsModal] = useState(false);

   const statusColor = {
      waiting_payment: 'warning',
      waiting_confirmation: 'info',
      on_progress: 'info',
      delivered: 'info',
      finish: 'success',
      stock_issue: 'error',
      waiting_restock: 'info',
      refund_pending: 'warning',
      refunded: 'error',
      canceled: 'error',
   } as const;

   const statusLabel = {
      waiting_payment: 'Waiting Payment',
      waiting_confirmation: 'Menunggu Konfirmasi',
      on_progress: 'On Progress',
      delivered: 'Delivered / Dikirim',
      finish: 'Finished',
      stock_issue: 'Stock Issue',
      waiting_restock: 'Waiting Restock',
      refund_pending: 'Refund Pending',
      refunded: 'Refunded',
      canceled: 'Canceled',
   } as const;

   const handleActionSuccess = () => {
      onActionSuccess();
      popover.onClose();
   };

   const canRefund = row.status === 'refund_pending';
   const canCancel =
      row.status !== 'finish' && row.status !== 'refunded' && row.status !== 'canceled';
   const canConfirmRestock = row.status === 'waiting_restock';
   const canDeliver = row.status === 'on_progress';
   const canFinish = row.status === 'delivered' || row.status === 'on_progress';
   const canConfirmPayment = row.status === 'waiting_confirmation';
   const canViewReviews = row.status === 'finish';

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
               <IconButton onClick={() => setOpenDetailModal(true)}>
                  <Iconify icon="solar:eye-bold" />
               </IconButton>

               <IconButton onClick={popover.onOpen}>
                  <Iconify icon="eva:more-vertical-fill" />
               </IconButton>
            </TableCell>
         </TableRow>

         <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
            <MenuList>
               {canConfirmPayment && (
                  <MenuItem
                     onClick={() => {
                        setOpenConfirmPaymentModal(true);
                        popover.onClose();
                     }}
                     sx={{ color: 'success.main' }}
                  >
                     <Iconify icon="solar:check-circle-bold" />
                     Konfirmasi Pembayaran
                  </MenuItem>
               )}

               {canRefund && (
                  <MenuItem
                     onClick={() => {
                        setOpenRefundModal(true);
                        popover.onClose();
                     }}
                  >
                     <Iconify icon="solar:wallet-money-bold" />
                     Process Refund
                  </MenuItem>
               )}

               {canConfirmRestock && (
                  <MenuItem
                     onClick={() => {
                        setOpenRestockModal(true);
                        popover.onClose();
                     }}
                  >
                     <Iconify icon="solar:box-bold" />
                     Confirm Restock
                  </MenuItem>
               )}

               {canDeliver && (
                  <MenuItem
                     onClick={() => {
                        setOpenDeliverModal(true);
                        popover.onClose();
                     }}
                     sx={{ color: 'info.main' }}
                  >
                     <Iconify icon="solar:delivery-bold" />
                     Kirim Pesanan (Mark as Delivered)
                  </MenuItem>
               )}

               {canFinish && (
                  <MenuItem
                     onClick={() => {
                        setOpenFinishModal(true);
                        popover.onClose();
                     }}
                  >
                     <Iconify icon="solar:check-circle-bold" />
                     {row.status === 'delivered' ? 'Selesaikan Pesanan (Force Finish)' : 'Mark as Finished'}
                  </MenuItem>
               )}

               {canViewReviews && (
                  <MenuItem
                     onClick={() => {
                        setOpenReviewsModal(true);
                        popover.onClose();
                     }}
                  >
                     <Iconify icon="solar:star-bold" />
                     Lihat Ulasan
                  </MenuItem>
               )}

               {canCancel && (
                  <MenuItem
                     onClick={() => {
                        setOpenCancelModal(true);
                        popover.onClose();
                     }}
                     sx={{ color: 'error.main' }}
                  >
                     <Iconify icon="solar:close-circle-bold" />
                     Cancel Order
                  </MenuItem>
               )}
            </MenuList>
         </CustomPopover>

         <OrderDetailModal
            open={openDetailModal}
            onClose={() => setOpenDetailModal(false)}
            order={row}
         />

         {canRefund && (
            <RefundModal
               open={openRefundModal}
               onClose={() => setOpenRefundModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
            />
         )}

         {canCancel && (
            <CancelModal
               open={openCancelModal}
               onClose={() => setOpenCancelModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
            />
         )}

         {canConfirmRestock && (
            <ConfirmRestockModal
               open={openRestockModal}
               onClose={() => setOpenRestockModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
            />
         )}

         {canDeliver && (
            <DeliverModal
               open={openDeliverModal}
               onClose={() => setOpenDeliverModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
            />
         )}

         {canFinish && (
            <FinishModal
               open={openFinishModal}
               onClose={() => setOpenFinishModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
            />
         )}
         {canConfirmPayment && (
            <ConfirmPaymentModal
               open={openConfirmPaymentModal}
               onClose={() => setOpenConfirmPaymentModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
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
