import type { Product } from 'src/types/product';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';

import { paths } from 'src/routes/al/paths';
import { useRouter } from 'src/routes/hooks';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

type Props = {
   row: Product;
   selected: boolean;
   onSelectRow: () => void;
   onDeleteRow: () => void;
};

export function ProductTableRow({ row, selected, onSelectRow, onDeleteRow }: Props) {
   const router = useRouter();
   const confirmDialog = useBoolean();

   const handleEdit = () => {
      router.push(paths.dashboard.products.edit(row.id!));
   };

   return (
      <>
         <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
            <TableCell padding="checkbox">
               <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
            </TableCell>

            <TableCell>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                     alt={row.title}
                     src={row.image ? `${CONFIG.apiHostUrl}/${row.image}` : ''}
                     variant="rounded"
                     sx={{ width: 48, height: 48 }}
                  />
               </Box>
            </TableCell>

            <TableCell>
               <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.product_number}
               </Typography>
            </TableCell>

            <TableCell>
               <Typography variant="body2">{row.title}</Typography>
               <Typography variant="caption" color="text.secondary">
                  {row.product_type?.title}
               </Typography>
            </TableCell>

            <TableCell align="right">
               <Typography variant="body2">Rp {row.sale_price?.toLocaleString()}</Typography>
            </TableCell>

            <TableCell align="center">
               <Chip
                  label={row.stock || 0}
                  size="small"
                  color={
                     (row.stock || 0) > 10 ? 'success' : (row.stock || 0) > 0 ? 'warning' : 'error'
                  }
               />
            </TableCell>

            <TableCell align="center">
               <Chip
                  label={row.is_active ? 'Active' : 'Inactive'}
                  size="small"
                  color={row.is_active ? 'success' : 'default'}
                  variant={row.is_active ? 'filled' : 'outlined'}
               />
            </TableCell>

            <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
               <Tooltip title="Edit" placement="top" arrow>
                  <IconButton color="default" onClick={handleEdit}>
                     <Iconify icon="solar:pen-bold" />
                  </IconButton>
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
            content="Are you sure want to delete this product?"
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
      </>
   );
}
