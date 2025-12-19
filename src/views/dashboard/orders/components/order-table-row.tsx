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

import { OrderDetailModal } from './order-detail-modal';
import { RefundModal } from './refund-modal';
import { CancelModal } from './cancel-modal';
import { ConfirmRestockModal } from './confirm-restock-modal';
import { FinishModal } from './finish-modal';

// ----------------------------------------------------------------------

type Props = {
   row: Order;
   onActionSuccess: () => void;
};

export function OrderTableRow({ row, onActionSuccess }: Props) {
   const popover = usePopover();
   const [openDetailModal, setOpenDetailModal] = useState(false);
   const [openRefundModal, setOpenRefundModal] = useState(false);
   const [openCancelModal, setOpenCancelModal] = useState(false);
   const [openRestockModal, setOpenRestockModal] = useState(false);
   const [openFinishModal, setOpenFinishModal] = useState(false);

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

   const handleActionSuccess = () => {
      onActionSuccess();
      popover.onClose();
   };

   const canRefund = row.status === 'refund_pending';
   const canCancel =
      row.status !== 'finish' && row.status !== 'refunded' && row.status !== 'canceled';
   const canConfirmRestock = row.status === 'waiting_restock';
   const canFinish = row.status === 'on_progress';

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

               {canFinish && (
                  <MenuItem
                     onClick={() => {
                        setOpenFinishModal(true);
                        popover.onClose();
                     }}
                  >
                     <Iconify icon="solar:check-circle-bold" />
                     Mark as Finished
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

         {canFinish && (
            <FinishModal
               open={openFinishModal}
               onClose={() => setOpenFinishModal(false)}
               order={row}
               onSuccess={handleActionSuccess}
            />
         )}
      </>
   );
}
