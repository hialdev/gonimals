import type { StockMovement } from 'src/types/stock-movement';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { Typography } from '@mui/material';

import { fDate, fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
   row: StockMovement;
};

export function StockMovementTableRow({ row }: Props) {
   const isIncrement = (row.qty || 0) > 0;
   const referenceTypeConfig = {
      purchase: {
         label: 'Purchase',
         color: 'info' as const,
         icon: 'solar:box-bold',
      },
      adjustment: {
         label: 'Adjustment',
         color: 'warning' as const,
         icon: 'solar:slider-vertical-bold',
      },
      order: {
         label: 'Order',
         color: 'error' as const,
         icon: 'solar:cart-bold',
      },
   };

   const typeConfig = referenceTypeConfig[row.reference_type || 'adjustment'];

   return (
      <TableRow hover tabIndex={-1}>
         <TableCell>
            <Typography variant="body2">{fDateTime(row.created_at)}</Typography>
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
               label={typeConfig.label}
               size="small"
               color={typeConfig.color}
               icon={<Iconify icon={typeConfig.icon} />}
            />
         </TableCell>

         <TableCell align="center">
            <Box
               sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: isIncrement ? 'success.lighter' : 'error.lighter',
               }}
            >
               <Iconify
                  icon={isIncrement ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                  sx={{ color: isIncrement ? 'success.main' : 'error.main' }}
               />
               <Typography
                  variant="body2"
                  sx={{
                     fontWeight: 600,
                     color: isIncrement ? 'success.main' : 'error.main',
                  }}
               >
                  {isIncrement ? '+' : ''}
                  {row.qty}
               </Typography>
            </Box>
         </TableCell>

         <TableCell>
            <Typography variant="caption">{row.description || '-'}</Typography>
         </TableCell>

         <TableCell>
            <Typography variant="caption" color="text.secondary">
               {row.reference_id?.substring(0, 8)}...
            </Typography>
         </TableCell>
      </TableRow>
   );
}
