import type { Order } from 'src/types/order';

import { useState } from 'react';
import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';

import { Iconify } from 'src/components/iconify';
import { Upload } from 'src/components/upload';
import useOrderStore from 'src/stores/order';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   order: Order;
   onSuccess: () => void;
};

export function RefundModal({ open, onClose, order, onSuccess }: Props) {
   const [reason, setReason] = useState('');
   const [images, setImages] = useState<(File | string)[]>([]);
   const [loading, setLoading] = useState(false);

   const { adminRefund } = useOrderStore();

   const handleSubmit = async () => {
      if (!reason.trim()) {
         toast.error('Reason is required');
         return;
      }

      setLoading(true);
      try {
         const formData = new FormData();
         formData.append('reason', reason);

         // Add images
         images.forEach((image) => {
            if (image instanceof File) {
               formData.append('images', image);
            }
         });

         const response = await adminRefund({ id: order.id!, data: formData });

         if (response.success) {
            toast.success('Order refunded successfully');
            onSuccess();
            handleClose();
         } else {
            toast.error(response.message || 'Failed to refund order');
         }
      } catch (error) {
         console.error(error);
         toast.error('An error occurred while processing refund');
      } finally {
         setLoading(false);
      }
   };

   const handleClose = () => {
      setReason('');
      setImages([]);
      onClose();
   };

   const handleDrop = (acceptedFiles: File[]) => {
      setImages([...images, ...acceptedFiles]);
   };

   const handleRemove = (file: File | string) => {
      setImages(images.filter((img) => img !== file));
   };

   return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:wallet-money-bold" width={28} color="warning.main" />
                  <Typography variant="h6">Process Refund</Typography>
               </Box>
               <IconButton onClick={handleClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
               {/* Order Info */}
               <Box>
                  <Typography variant="caption" color="text.secondary">
                     Order Number
                  </Typography>
                  <Typography variant="subtitle1">{order.order_number}</Typography>
               </Box>

               {/* Reason */}
               <TextField
                  label="Refund Reason"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Refund telah diproses ke rekening customer BCA 1234567890"
                  required
                  fullWidth
               />

               {/* Image Upload */}
               <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                     Proof Images (Optional)
                  </Typography>
                  <Upload
                     multiple
                     value={images}
                     onDrop={handleDrop}
                     onRemove={handleRemove}
                     accept={{ 'image/*': [] }}
                  />
               </Box>
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} variant="outlined" color="inherit">
               Cancel
            </Button>
            <Button
               onClick={handleSubmit}
               variant="contained"
               color="warning"
               disabled={loading || !reason.trim()}
               startIcon={<Iconify icon="solar:wallet-money-bold" />}
            >
               {loading ? 'Processing...' : 'Process Refund'}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
