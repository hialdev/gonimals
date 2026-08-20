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

import { Iconify } from 'src/components/iconify';
import useOrderStore from 'src/stores/order';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   order: Order;
   onSuccess: () => void;
};

export function ConfirmReceiptModal({ open, onClose, order, onSuccess }: Props) {
   const [loading, setLoading] = useState(false);
   const { confirmReceipt } = useOrderStore();

   const handleSubmit = async () => {
      setLoading(true);
      try {
         const response = await confirmReceipt({ id: order.id! });

         if (response.success) {
            toast.success('Pesanan telah berhasil dikonfirmasi diterima!');
            onSuccess();
            onClose();
         } else {
            toast.error(response.message || 'Gagal mengonfirmasi pesanan');
         }
      } catch (error) {
         console.error(error);
         toast.error('Terjadi kesalahan saat mengonfirmasi pesanan');
      } finally {
         setLoading(false);
      }
   };

   return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:check-circle-bold" width={28} color="success.main" />
                  <Typography variant="h6">Konfirmasi Diterima</Typography>
               </Box>
               <IconButton onClick={onClose}>
                  <Iconify icon="solar:close-circle-bold" />
               </IconButton>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
               <Typography variant="body1">
                  Apakah Anda yakin telah menerima pesanan <strong>{order.order_number}</strong> dalam kondisi baik?
               </Typography>
               <Typography variant="caption" color="text.secondary">
                  Setelah dikonfirmasi, pesanan akan ditandai selesai dan Anda dapat memberikan ulasan produk.
               </Typography>
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} variant="outlined" color="inherit">
               Batal
            </Button>
            <Button
               onClick={handleSubmit}
               variant="contained"
               color="success"
               disabled={loading}
               startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
               {loading ? 'Memproses...' : 'Ya, Pesanan Diterima'}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
