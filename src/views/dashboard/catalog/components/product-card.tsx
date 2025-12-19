import type { Product } from 'src/types/product';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';

import { CONFIG } from 'src/global-config';

import useFavoriteStore from 'src/stores/favorite';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
   product: Product;
   onAddToCart: () => void;
};

export function ProductCard({ product, onAddToCart }: Props) {
   const { isFavorite, toggleFavorite } = useFavoriteStore();
   const [isFav, setIsFav] = useState(isFavorite(product.id!));

   const handleToggleFavorite = () => {
      toggleFavorite(product.id!);
      setIsFav(!isFav);
   };

   const imageUrl = product.image
      ? `${process.env.NEXT_PUBLIC_API_HOST}/${product.image}`
      : '/assets/placeholder.svg';

   const stock = product.stock || 0;
   const isOutOfStock = stock <= 0;

   return (
      <Card
         sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
         }}
      >
         {/* Favorite Button */}
         <IconButton
            onClick={handleToggleFavorite}
            sx={{
               position: 'absolute',
               top: 8,
               right: 8,
               zIndex: 9,
               bgcolor: 'background.paper',
               '&:hover': {
                  bgcolor: 'background.paper',
               },
            }}
         >
            <Iconify
               icon={isFav ? 'solar:heart-bold' : 'solar:heart-linear'}
               color={isFav ? 'error.main' : 'text.secondary'}
               width={24}
            />
         </IconButton>

         {/* Product Image */}
         <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={product.title}
            sx={{
               objectFit: 'cover',
               bgcolor: 'background.neutral',
            }}
         />

         <CardContent sx={{ flexGrow: 1 }}>
            {/* Product Title */}
            <Typography variant="h6" gutterBottom noWrap>
               {product.title}
            </Typography>

            {/* Product Description */}
            {product.description && (
               <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                     mb: 2,
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                  }}
               >
                  {product.description}
               </Typography>
            )}

            {/* Price */}
            <Typography variant="h5" color="primary.main" sx={{ mb: 1 }}>
               {fCurrency(product.sale_price || 0)}
            </Typography>

            {/* Stock Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Typography variant="caption" color="text.secondary">
                  Stock:
               </Typography>
               <Chip
                  label={isOutOfStock ? 'Out of Stock' : `${stock} available`}
                  size="small"
                  color={isOutOfStock ? 'error' : 'success'}
                  variant="outlined"
               />
            </Box>
         </CardContent>

         <CardActions sx={{ p: 2, pt: 0 }}>
            <Button
               fullWidth
               variant="contained"
               startIcon={<Iconify icon="solar:cart-plus-bold" />}
               onClick={onAddToCart}
               disabled={isOutOfStock}
            >
               Add to Cart
            </Button>
         </CardActions>
      </Card>
   );
}
