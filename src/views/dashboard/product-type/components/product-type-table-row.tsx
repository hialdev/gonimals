import type { ProductType } from 'src/types/product-type';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { ProductTypeCUForm } from '../forms/product-type-cu-form';

// ----------------------------------------------------------------------

type Props = {
   row: ProductType;
   selected: boolean;
   onSelectRow: () => void;
   onDeleteRow: () => void;
   onSuccessEdit?: () => void;
};

export function ProductTypeTableRow({
   row,
   selected,
   onSelectRow,
   onDeleteRow,
   onSuccessEdit,
}: Props) {
   const confirmDialog = useBoolean();
   const editDialog = useBoolean();

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

            <TableCell>{row.title}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.slug}</TableCell>

            <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
               <Tooltip title="Edit" placement="top" arrow>
                  <IconButton color="default" onClick={editDialog.onTrue}>
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
            content="Are you sure want to delete this item?"
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

         <ProductTypeCUForm
            open={editDialog.value}
            onClose={editDialog.onFalse}
            currentProductType={row}
            onSuccess={onSuccessEdit}
         />
      </>
   );
}
