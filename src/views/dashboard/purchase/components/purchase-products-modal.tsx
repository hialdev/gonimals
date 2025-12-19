import type { PurchaseProduct } from 'src/types/purchase';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import { Typography } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   products: PurchaseProduct[];
   purchaseNumber?: string;
};

export function PurchaseProductsModal({ open, onClose, products, purchaseNumber }: Props) {
   const totalAmount = products.reduce((sum, item) => {
      return sum + (item.subtotal || 0);
   }, 0);

   return (
      <Dialog
         fullWidth
         maxWidth="md"
         open={open}
         onClose={onClose}
         PaperProps={{
            sx: { borderRadius: 2 },
         }}
      >
         <DialogTitle>
            Purchase Products
            {purchaseNumber && (
               <Box
                  component="span"
                  sx={{
                     display: 'block',
                     fontSize: '0.875rem',
                     color: 'text.secondary',
                     fontWeight: 400,
                  }}
               >
                  {purchaseNumber}
               </Box>
            )}
         </DialogTitle>

         <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               {products.map((product, index) => (
                  <Card
                     key={product.id || index}
                     sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                           bgcolor: 'action.hover',
                        },
                     }}
                  >
                     {product.product?.image && (
                        <Avatar
                           src={`${CONFIG.apiHostUrl}/${product.product.image}`}
                           variant="rounded"
                           sx={{ width: 64, height: 64 }}
                        />
                     )}

                     <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                           {product.product?.title || 'Unknown Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           {product.product?.product_number}
                        </Typography>
                     </Box>

                     <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                        <Typography variant="body2" color="text.secondary">
                           Qty: {product.qty}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                           @ Rp {(product.purchase_price || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
                           Rp {(product.subtotal || 0).toLocaleString()}
                        </Typography>
                     </Box>
                  </Card>
               ))}

               {/* Total Summary */}
               <Card
                  sx={{
                     p: 2,
                     mb: 3,
                     bgcolor: 'primary.lighter',
                     border: '1px solid',
                     borderColor: 'primary.main',
                  }}
               >
                  <Box
                     sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                     <Typography variant="subtitle2">Total</Typography>
                     <Typography variant="subtitle2" color="primary.main">
                        Rp {totalAmount.toLocaleString()}
                     </Typography>
                  </Box>
               </Card>
            </Box>
         </DialogContent>
      </Dialog>
   );
}
