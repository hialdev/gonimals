import type { Purchase } from 'src/types/purchase';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';

import { paths } from 'src/routes/al/paths';
import { useRouter } from 'src/routes/hooks';
import { fDate } from 'src/utils/format-time';
import usePurchaseStore from 'src/stores/purchase';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { PurchaseProductsModal } from './purchase-products-modal';
import { PurchaseReceiveModal } from './purchase-receive-modal';

// ----------------------------------------------------------------------

type Props = {
   row: Purchase;
   selected: boolean;
   onSelectRow: () => void;
   onDeleteRow: () => void;
   onRefresh?: () => void;
};

export function PurchaseTableRow({ row, selected, onSelectRow, onDeleteRow, onRefresh }: Props) {
   const router = useRouter();
   const confirmDialog = useBoolean();
   const productsModal = useBoolean();
   const receiveModal = useBoolean();

   const handleEdit = () => {
      router.push(paths.dashboard.purchases.edit(row.id!));
   };

   // Calculate total from purchase_products (backend sends this, not 'items')
   const totalAmount = row.total_price || 0;
   const itemCount = row.purchase_products?.length || 0;
   const isFinished = row.is_clear === true;

   return (
      <>
         <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
            <TableCell padding="checkbox">
               <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
            </TableCell>

            <TableCell>
               <Typography variant="body2">{fDate(row.purchase_date)}</Typography>
               {isFinished && (
                  <Chip label="Finished" size="small" color="success" sx={{ mt: 0.5 }} />
               )}
               {row.status === 'partial' && !isFinished && (
                  <Chip label="Partial Receive" size="small" color="warning" sx={{ mt: 0.5 }} />
               )}
            </TableCell>

            <TableCell>
               <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.principle?.title}
               </Typography>
            </TableCell>

            <TableCell>
               <Chip
                  label={`${itemCount} items`}
                  size="small"
                  color="info"
                  onClick={productsModal.onTrue}
                  sx={{ cursor: 'pointer' }}
               />
            </TableCell>

            <TableCell align="right">
               <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Rp {totalAmount.toLocaleString()}
               </Typography>
            </TableCell>

            <TableCell>
               <Typography
                  variant="caption"
                  sx={{
                     maxWidth: 200,
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     whiteSpace: 'nowrap',
                     display: 'block',
                  }}
               >
                  {row.notes || '-'}
               </Typography>
            </TableCell>

            <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
               <Tooltip
                  title={isFinished ? 'View Receive History' : 'Receive Products'}
                  placement="top"
                  arrow
               >
                  <IconButton color={isFinished ? 'default' : 'info'} onClick={receiveModal.onTrue}>
                     <Iconify icon="solar:box-minimalistic-bold" />
                  </IconButton>
               </Tooltip>

               <Tooltip
                  title={isFinished ? 'Cannot edit finished purchase' : 'Edit'}
                  placement="top"
                  arrow
               >
                  <span>
                     <IconButton color="default" onClick={handleEdit} disabled={isFinished}>
                        <Iconify icon="solar:pen-bold" />
                     </IconButton>
                  </span>
               </Tooltip>

               <Tooltip title="Delete" placement="top" arrow>
                  <IconButton color="error" onClick={confirmDialog.onTrue}>
                     <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
               </Tooltip>
            </TableCell>
         </TableRow>

         <ConfirmDialog
            open={confirmDialog.value}
            onClose={confirmDialog.onFalse}
            title="Delete"
            content="Are you sure want to delete this purchase?"
            action={
               <IconButton
                  color="error"
                  onClick={() => {
                     onDeleteRow();
                     confirmDialog.onFalse();
                  }}
               >
                  <Iconify icon="solar:trash-bin-trash-bold" />
               </IconButton>
            }
         />

         <PurchaseReceiveModal
            open={receiveModal.value}
            onClose={receiveModal.onFalse}
            purchase={row}
            onRefresh={onRefresh}
         />

         <PurchaseProductsModal
            open={productsModal.value}
            onClose={productsModal.onFalse}
            products={row.purchase_products || []}
            purchaseNumber={row.purchase_number}
         />
      </>
   );
}
