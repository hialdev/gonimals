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
   const finishDialog = useBoolean();
   const [finishing, setFinishing] = useState(false);
   const { finish } = usePurchaseStore();

   const handleEdit = () => {
      router.push(paths.dashboard.purchases.edit(row.id!));
   };

   const handleFinish = async () => {
      setFinishing(true);
      try {
         const result = await finish({ id: row.id! });
         if (result.success) {
            toast.success(
               'Purchase berhasil di-finish! Stock telah diupdate dan purchase terkunci.'
            );
            finishDialog.onFalse();
            if (onRefresh) onRefresh();
         } else {
            toast.error(result.message || 'Gagal finish purchase');
         }
      } catch (error) {
         console.error(error);
         toast.error('Terjadi kesalahan saat finish purchase');
      } finally {
         setFinishing(false);
      }
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
               {!isFinished && (
                  <Tooltip title="Finish" placement="top" arrow>
                     <IconButton color="success" onClick={finishDialog.onTrue}>
                        <Iconify icon="solar:check-circle-bold" />
                     </IconButton>
                  </Tooltip>
               )}

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

         <ConfirmDialog
            open={finishDialog.value}
            onClose={finishDialog.onFalse}
            title="Finish Purchase"
            content={
               <>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                     Apakah Anda yakin ingin finish purchase ini?
                  </Typography>
                  <Box
                     sx={{
                        p: 2,
                        bgcolor: 'warning.lighter',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'warning.main',
                     }}
                  >
                     <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        ⚠️ Perhatian:
                     </Typography>
                     <Typography variant="caption" component="div">
                        • Stock produk akan diupdate
                     </Typography>
                     <Typography variant="caption" component="div">
                        • Purchase akan terkunci dan tidak bisa diedit lagi
                     </Typography>
                     <Typography variant="caption" component="div">
                        • Stock movement akan tercatat
                     </Typography>
                  </Box>
               </>
            }
            action={
               <Button
                  variant="contained"
                  color="success"
                  onClick={handleFinish}
                  disabled={finishing}
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
               >
                  {finishing ? 'Processing...' : 'Finish Purchase'}
               </Button>
            }
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
