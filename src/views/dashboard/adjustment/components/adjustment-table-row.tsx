import type { Adjustment } from 'src/types/adjustment';

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

import { fDate } from 'src/utils/format-time';
import useAdjustmentStore from 'src/stores/adjustment';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { AdjustmentCUForm } from '../forms/adjustment-cu-form';

// ----------------------------------------------------------------------

type Props = {
   row: Adjustment;
   selected: boolean;
   onSelectRow: () => void;
   onDeleteRow: () => void;
   onSuccessEdit?: () => void;
   onRefresh?: () => void;
};

export function AdjustmentTableRow({
   row,
   selected,
   onSelectRow,
   onDeleteRow,
   onSuccessEdit,
   onRefresh,
}: Props) {
   const confirmDialog = useBoolean();
   const editDialog = useBoolean();
   const finishDialog = useBoolean();
   const [finishing, setFinishing] = useState(false);
   const { finish } = useAdjustmentStore();

   const isFinished = row.is_clear === true;

   const handleFinish = async () => {
      setFinishing(true);
      try {
         const result = await finish({ id: row.id! });
         if (result.success) {
            toast.success('Adjustment berhasil di-finish! Stock telah diupdate.');
            finishDialog.onFalse();
            if (onRefresh) onRefresh();
         } else {
            toast.error(result.message || 'Gagal finish adjustment');
         }
      } catch (error) {
         console.error(error);
         toast.error('Terjadi kesalahan saat finish adjustment');
      } finally {
         setFinishing(false);
      }
   };

   return (
      <>
         <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
            <TableCell padding="checkbox">
               <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
            </TableCell>

            <TableCell>
               <Typography variant="body2">{fDate(row.created_at)}</Typography>
               {isFinished && (
                  <Chip label="Finished" size="small" color="success" sx={{ mt: 0.5 }} />
               )}
            </TableCell>

            <TableCell>
               <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.product?.product_number}
               </Typography>
               <Typography variant="caption" color="text.secondary">
                  {row.product?.title}
               </Typography>
            </TableCell>

            <TableCell align="center">
               <Chip
                  label={row.is_increment ? 'Increment' : 'Decrement'}
                  size="small"
                  color={row.is_increment ? 'success' : 'warning'}
                  icon={
                     <Iconify
                        icon={row.is_increment ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                     />
                  }
               />
            </TableCell>

            <TableCell align="center">
               <Typography
                  variant="body2"
                  sx={{
                     fontWeight: 600,
                     color: row.is_increment ? 'success.main' : 'warning.main',
                  }}
               >
                  {row.is_increment ? '+' : '-'}
                  {row.qty}
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
                  {row.description || '-'}
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
                  title={isFinished ? 'Cannot edit finished adjustment' : 'Edit'}
                  placement="top"
                  arrow
               >
                  <span>
                     <IconButton color="default" onClick={editDialog.onTrue} disabled={isFinished}>
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
            content="Are you sure want to delete this adjustment?"
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
            title="Finish Adjustment"
            content={
               <>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                     Apakah Anda yakin ingin finish adjustment ini?
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
                        • Stock produk akan {row.is_increment ? 'bertambah' : 'berkurang'} sebanyak{' '}
                        {row.qty}
                     </Typography>
                     <Typography variant="caption" component="div">
                        • Adjustment akan terkunci dan tidak bisa diedit lagi
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
                  {finishing ? 'Processing...' : 'Finish Adjustment'}
               </Button>
            }
         />

         <AdjustmentCUForm
            open={editDialog.value}
            onClose={editDialog.onFalse}
            currentAdjustment={row}
            onSuccess={onSuccessEdit}
         />
      </>
   );
}
