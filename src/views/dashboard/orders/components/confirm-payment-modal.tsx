'use client';

import type { Order } from 'src/types/order';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import useOrderStore from 'src/stores/order';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   order: Order;
   onSuccess: () => void;
};

export function ConfirmPaymentModal({ open, onClose, order, onSuccess }: Props) {
   const [loading, setLoading] = useState(false);
   const [rejecting, setRejecting] = useState(false);
   const [rejectReason, setRejectReason] = useState('');
   const [showRejectForm, setShowRejectForm] = useState(false);

   const { confirmPayment, rejectPayment } = useOrderStore();

   const apiHost = process.env.NEXT_PUBLIC_API_HOST || '';
   const proofUrl = (order as any).transfer_proof
      ? `${apiHost}/${(order as any).transfer_proof}`
      : null;
   const bank = (order as any).bank;

   const handleConfirm = async () => {
      setLoading(true);
      try {
         const result = await confirmPayment({ id: order.id! });
         if (result.success) {
            toast.success('Pembayaran dikonfirmasi! Order diproses.');
            onSuccess();
            onClose();
         } else {
            toast.error(result.message || 'Gagal mengkonfirmasi pembayaran');
         }
      } catch {
         toast.error('Terjadi kesalahan');
      }
      setLoading(false);
   };

   const handleReject = async () => {
      if (!rejectReason.trim()) {
         toast.error('Alasan penolakan wajib diisi');
         return;
      }
      setRejecting(true);
      try {
         const result = await rejectPayment({ id: order.id!, reason: rejectReason });
         if (result.success) {
            toast.success('Pembayaran ditolak. Customer akan upload ulang.');
            onSuccess();
            onClose();
         } else {
            toast.error(result.message || 'Gagal menolak pembayaran');
         }
      } catch {
         toast.error('Terjadi kesalahan');
      }
      setRejecting(false);
   };

   const handleClose = () => {
      setShowRejectForm(false);
      setRejectReason('');
      onClose();
   };

   return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
         <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:bill-check-bold" width={28} color="info.main" />
                  <Typography variant="h6">Konfirmasi Pembayaran Transfer</Typography>
               </Box>
            </Box>
         </DialogTitle>

         <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
               {/* Order Info */}
               <Box
                  sx={{
                     p: 2,
                     bgcolor: 'background.neutral',
                     borderRadius: 1,
                     display: 'flex',
                     justifyContent: 'space-between',
                  }}
               >
                  <Box>
                     <Typography variant="caption" color="text.secondary">
                        No. Order
                     </Typography>
                     <Typography variant="subtitle2">{order.order_number}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                     <Typography variant="caption" color="text.secondary">
                        Total
                     </Typography>
                     <Typography variant="subtitle1" color="primary.main">
                        {fCurrency(order.total_bill || 0)}
                     </Typography>
                  </Box>
               </Box>

               {/* Bank Info */}
               {bank && (
                  <Alert severity="info" icon={<Iconify icon="solar:bank-bold" />}>
                     Transfer ke: <strong>{bank.name}</strong> ({bank.account_number}) a.n.{' '}
                     {bank.account_name}
                  </Alert>
               )}

               {/* Transfer Proof */}
               {proofUrl ? (
                  <Box>
                     <Typography variant="subtitle2" gutterBottom>
                        Bukti Transfer:
                     </Typography>
                     <Box
                        component="img"
                        src={proofUrl}
                        alt="Bukti Transfer"
                        sx={{
                           width: '100%',
                           maxHeight: 300,
                           objectFit: 'contain',
                           borderRadius: 1,
                           border: 1,
                           borderColor: 'divider',
                        }}
                        onError={(e: any) => {
                           e.target.style.display = 'none';
                        }}
                     />
                     <Button
                        size="small"
                        href={proofUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                        startIcon={<Iconify icon="solar:external-link-bold" />}
                     >
                        Buka di tab baru
                     </Button>
                  </Box>
               ) : (
                  <Alert severity="warning">Tidak ada bukti transfer yang diunggah.</Alert>
               )}

               {/* Reject form */}
               {showRejectForm && (
                  <>
                     <Divider />
                     <TextField
                        label="Alasan Penolakan"
                        multiline
                        rows={3}
                        fullWidth
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Contoh: Bukti transfer tidak jelas, jumlah tidak sesuai, dll."
                     />
                  </>
               )}
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleClose} color="inherit" variant="outlined">
               Tutup
            </Button>

            {!showRejectForm ? (
               <>
                  <Button
                     variant="outlined"
                     color="error"
                     onClick={() => setShowRejectForm(true)}
                     startIcon={<Iconify icon="solar:close-circle-bold" />}
                  >
                     Tolak
                  </Button>
                  <LoadingButton
                     variant="contained"
                     color="success"
                     loading={loading}
                     onClick={handleConfirm}
                     startIcon={<Iconify icon="solar:check-circle-bold" />}
                  >
                     Konfirmasi
                  </LoadingButton>
               </>
            ) : (
               <>
                  <Button
                     variant="outlined"
                     color="inherit"
                     onClick={() => setShowRejectForm(false)}
                  >
                     Kembali
                  </Button>
                  <LoadingButton
                     variant="contained"
                     color="error"
                     loading={rejecting}
                     onClick={handleReject}
                  >
                     Kirim Penolakan
                  </LoadingButton>
               </>
            )}
         </DialogActions>
      </Dialog>
   );
}
