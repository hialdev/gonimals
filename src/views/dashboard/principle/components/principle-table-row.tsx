import type { Principle } from 'src/types/principle';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { PrincipleCUForm } from '../forms/principle-cu-form';

// ----------------------------------------------------------------------

type Props = {
   row: Principle;
   selected: boolean;
   onSelectRow: () => void;
   onDeleteRow: () => void;
   onSuccessEdit?: () => void;
};

export function PrincipleTableRow({
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
               <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.title}
               </Typography>
            </TableCell>

            <TableCell>
               <Typography variant="body2" sx={{ maxWidth: 300 }}>
                  {row.address}
               </Typography>
            </TableCell>

            <TableCell>
               <Typography variant="body2">{row.pic_name}</Typography>
            </TableCell>

            <TableCell>
               <Typography variant="body2">{row.contact_phone}</Typography>
               <Typography variant="caption" color="text.secondary">
                  {row.contact_mail}
               </Typography>
            </TableCell>

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
            content="Are you sure want to delete this principle?"
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

         <PrincipleCUForm
            open={editDialog.value}
            onClose={editDialog.onFalse}
            currentPrinciple={row}
            onSuccess={onSuccessEdit}
         />
      </>
   );
}
