import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Iconify } from 'src/components/iconify';
import useProductReviewStore from 'src/stores/product-review';

// ----------------------------------------------------------------------

type Props = {
   productId: string;
   onClick?: (e: React.MouseEvent) => void;
};

export function ProductRating({ productId, onClick }: Props) {
   const { getByProduct } = useProductReviewStore();
   const [avgRating, setAvgRating] = useState('0.0');
   const [total, setTotal] = useState(0);

   useEffect(() => {
      let active = true;
      getByProduct(productId, { limit: 1 }).then((res) => {
         if (active && res.success && res.data?.stats) {
            setAvgRating(res.data.stats.average_rating);
            setTotal(res.data.stats.total_reviews);
         }
      });
      return () => {
         active = false;
      };
   }, [productId, getByProduct]);

   if (total === 0) return null;

   return (
      <Box
         onClick={(e) => {
            if (onClick) {
               e.stopPropagation();
               onClick(e);
            }
         }}
         sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: onClick ? 'pointer' : 'default',
            bgcolor: 'background.neutral',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            ...(onClick && {
               '&:hover': { bgcolor: 'action.hover' },
            }),
         }}
      >
         <Iconify icon="solar:star-bold" sx={{ color: 'warning.main' }} width={16} />
         <Typography variant="subtitle2">{avgRating}</Typography>
         <Typography variant="caption" color="text.secondary">
            ({total})
         </Typography>
      </Box>
   );
}
