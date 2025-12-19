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

export function ConfirmRestockModal({ open, onClose, order, onSuccess }: Props) {
   const [reason, setReason] = useState('Stock telah tersedia, pesanan diproses');
   const [images, setImages] = useState<(File | string)[]>([]);
   const [loading, setLoading] = useState(false);

   const { adminConfirmRestock } = useOrderStore();

   const handleSubmit = async () => {
      setLoading(true);
      try {
         const formData = new FormData();
         formData.append('reason', reason);

         images.forEach((image) => {
            if (image instanceof File) {
               formData.append('images', image);
            }
         });

         const response = await adminConfirmRestock({ id: order.id!, data: formData });

         if (response.success) {
            toast.success('Restock confirmed, order is now in progress');
            onSuccess();
            handleClose();
         } else {
            toast.error(response.message || 'Failed to confirm restock');
         }
      } catch (error) {
         console.error(error);
         toast.error('An error occurred while confirming restock');
      } finally {
         setLoading(false);
      }
   };

   const handleClose = () => {
      setReason('Stock telah tersedia, pesanan diproses');
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
                  <Iconify icon="solar:box-bold" width={28} color="info.main" />
                  <Typography variant="h6">Confirm Restock</Typography>
               </Box>
               <IconButton onClick={handleClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
               <Box>
                  <Typography variant="caption" color="text.secondary">
                     Order Number
                  </Typography>
                  <Typography variant="subtitle1">{order.order_number}</Typography>
               </Box>

               <TextField
                  label="Confirmation Note"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Stock telah tersedia, pesanan diproses"
                  fullWidth
               />

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
               color="info"
               disabled={loading}
               startIcon={<Iconify icon="solar:box-bold" />}
            >
               {loading ? 'Processing...' : 'Confirm Restock'}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
