'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import type { Bank } from 'src/types/bank';
import { paths } from 'src/routes/al/paths';

import useOrderStore from 'src/stores/order';
import useBankStore from 'src/stores/bank';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

const statusColor: Record<string, any> = {
   waiting_payment: 'warning',
   waiting_confirmation: 'info',
   on_progress: 'info',
   finish: 'success',
   canceled: 'error',
};

const statusLabel: Record<string, string> = {
   waiting_payment: 'Menunggu Pembayaran',
   waiting_confirmation: 'Menunggu Konfirmasi',
   on_progress: 'Sedang Diproses',
   finish: 'Selesai',
   canceled: 'Dibatalkan',
};

// ----------------------------------------------------------------------

export function PaymentView() {
   const params = useParams();
   const router = useRouter();
   const orderId = params.orderId as string;

   const { getMyOrder, uploadTransferProof } = useOrderStore();
   const { all: allBanks } = useBankStore();

   const [loading, setLoading] = useState(true);
   const [order, setOrder] = useState<any>(null);
   const [banks, setBanks] = useState<Bank[]>([]);
   const [selectedBankId, setSelectedBankId] = useState('');
   const [proofFile, setProofFile] = useState<File | null>(null);
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const selectedBank = banks.find((b) => b.id === selectedBankId);

   const fetchOrder = async () => {
      setLoading(true);
      try {
         const res = await getMyOrder({ id: orderId });
         if (res.success && res.data) {
            setOrder(res.data);
         } else {
            toast.error('Gagal memuat data pesanan');
         }
      } catch {
         toast.error('Gagal memuat data pesanan');
      }
      setLoading(false);
   };

   useEffect(() => {
      if (orderId) {
         fetchOrder();
         allBanks({ is_active: 'true', limit: 50 }).then((res: any) => {
            if (res.success && res.data?.banks) {
               setBanks(res.data.banks);
            }
         });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [orderId]);

   const handleUploadTransfer = async () => {
      if (!selectedBankId) {
         toast.error('Pilih bank terlebih dahulu');
         return;
      }
      if (!proofFile) {
         toast.error('Upload bukti transfer terlebih dahulu');
         return;
      }
      setUploading(true);
      try {
         const formData = new FormData();
         formData.append('bank_id', selectedBankId);
         formData.append('transfer_proof', proofFile);
         const result = await uploadTransferProof({ id: orderId, data: formData });
         if (result.success) {
            toast.success('Bukti transfer berhasil dikirim! Menunggu konfirmasi admin.');
            fetchOrder();
         } else {
            toast.error(result.message || 'Gagal mengirim bukti transfer');
         }
      } catch {
         toast.error('Terjadi kesalahan');
      }
      setUploading(false);
   };

   if (loading) {
      return (
         <DashboardContent>
            <LoadingScreen />
         </DashboardContent>
      );
   }

   if (!order) {
      return (
         <DashboardContent>
            <Card sx={{ p: 8, textAlign: 'center' }}>
               <Typography variant="h6" color="text.secondary">
                  Pesanan tidak ditemukan
               </Typography>
               <Button
                  variant="contained"
                  onClick={() => router.push(paths.dashboard.customer_orders.my_orders)}
                  sx={{ mt: 2 }}
               >
                  Kembali ke My Orders
               </Button>
            </Card>
         </DashboardContent>
      );
   }

   const isWaitingPayment = order.status === 'waiting_payment';
   const isWaitingConfirmation = order.status === 'waiting_confirmation';

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Payment"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'My Orders', href: paths.dashboard.customer_orders.my_orders },
               { name: 'Payment' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Card sx={{ p: 4, maxWidth: 640, mx: 'auto' }}>
            {/* Order Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
               <Typography variant="h5" gutterBottom>
                  Order #{order.order_number}
               </Typography>
               <Chip
                  label={statusLabel[order.status] || order.status}
                  color={statusColor[order.status] || 'default'}
                  size="medium"
                  variant="soft"
               />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Total Amount */}
            <Box
               sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 3,
                  bgcolor: 'background.neutral',
                  borderRadius: 2,
                  mb: 3,
               }}
            >
               <Typography variant="h6">Total Pembayaran:</Typography>
               <Typography variant="h4" color="primary.main">
                  {fCurrency(order.total_bill || 0)}
               </Typography>
            </Box>

            {/* ── Waiting Payment: show payment options ── */}
            {isWaitingPayment && (
               <>
                  {/* Option A: Xendit */}
                  {order.xendit_invoice_url && (
                     <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                           Opsi 1 — Bayar via Xendit
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                           Pembayaran otomatis lewat berbagai metode (kartu kredit, VA, e-wallet,
                           dll)
                        </Typography>
                        <Button
                           fullWidth
                           variant="contained"
                           size="large"
                           href={order.xendit_invoice_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           startIcon={<Iconify icon="solar:card-send-bold" />}
                        >
                           Bayar Sekarang via Xendit
                        </Button>
                     </Box>
                  )}

                  {order.xendit_invoice_url && (
                     <Divider sx={{ my: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                           ATAU
                        </Typography>
                     </Divider>
                  )}

                  {/* Option B: Manual Transfer */}
                  <Box>
                     <Typography variant="subtitle1" gutterBottom>
                        Opsi {order.xendit_invoice_url ? '2' : '1'} — Transfer Manual
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Transfer ke rekening bank di bawah dan upload bukti transfer
                     </Typography>

                     {banks.length > 0 ? (
                        <>
                           {/* Bank selector */}
                           <TextField
                              select
                              fullWidth
                              label="Pilih Bank Tujuan"
                              value={selectedBankId}
                              onChange={(e) => setSelectedBankId(e.target.value)}
                              sx={{ mb: 2 }}
                           >
                              {banks.map((bank) => (
                                 <MenuItem key={bank.id} value={bank.id}>
                                    {bank.name}
                                 </MenuItem>
                              ))}
                           </TextField>

                           {/* Bank account details */}
                           {selectedBank && (
                              <Box
                                 sx={{
                                    p: 2,
                                    mb: 2,
                                    bgcolor: 'info.lighter',
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'info.light',
                                 }}
                              >
                                 <Typography variant="body2" color="info.darker">
                                    <strong>Bank:</strong> {selectedBank.name}
                                 </Typography>
                                 <Typography variant="body2" color="info.darker">
                                    <strong>No. Rekening:</strong> {selectedBank.account_number}
                                 </Typography>
                                 <Typography variant="body2" color="info.darker">
                                    <strong>Atas Nama:</strong> {selectedBank.account_name}
                                 </Typography>
                                 <Typography variant="body2" color="info.darker" sx={{ mt: 1 }}>
                                    <strong>Jumlah Transfer:</strong>{' '}
                                    <span style={{ fontWeight: 700, fontSize: '1.1em' }}>
                                       {fCurrency(order.total_bill || 0)}
                                    </span>
                                 </Typography>
                              </Box>
                           )}

                           {/* Proof upload */}
                           <Box sx={{ mb: 2 }}>
                              <input
                                 ref={fileInputRef}
                                 type="file"
                                 accept="image/*,.pdf"
                                 style={{ display: 'none' }}
                                 onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              />
                              <Button
                                 fullWidth
                                 variant="outlined"
                                 startIcon={<Iconify icon="solar:upload-bold" />}
                                 onClick={() => fileInputRef.current?.click()}
                              >
                                 {proofFile ? proofFile.name : 'Pilih Bukti Transfer'}
                              </Button>
                              {proofFile && (
                                 <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: 'block' }}
                                 >
                                    File: {proofFile.name}
                                 </Typography>
                              )}
                           </Box>

                           <LoadingButton
                              fullWidth
                              variant="contained"
                              color="success"
                              size="large"
                              loading={uploading}
                              disabled={!selectedBankId || !proofFile}
                              onClick={handleUploadTransfer}
                              startIcon={<Iconify icon="solar:check-circle-bold" />}
                           >
                              Kirim Bukti Transfer
                           </LoadingButton>
                        </>
                     ) : (
                        <Alert severity="info">
                           Tidak ada bank yang tersedia untuk transfer manual. Gunakan Xendit.
                        </Alert>
                     )}
                  </Box>
               </>
            )}

            {/* ── Waiting Confirmation ── */}
            {isWaitingConfirmation && (
               <Box
                  sx={{
                     p: 3,
                     bgcolor: 'info.lighter',
                     borderRadius: 2,
                     textAlign: 'center',
                     mb: 3,
                  }}
               >
                  <Iconify
                     icon="solar:clock-circle-bold"
                     width={64}
                     sx={{ color: 'info.main', mb: 2 }}
                  />
                  <Typography variant="h6" color="info.darker" gutterBottom>
                     Menunggu Konfirmasi Admin
                  </Typography>
                  <Typography variant="body2" color="info.darker">
                     Bukti transfer Anda sedang diperiksa oleh admin. Harap tunggu konfirmasi.
                  </Typography>
                  {order.bank && (
                     <Box sx={{ mt: 2, textAlign: 'left' }}>
                        <Typography variant="caption" color="info.darker">
                           Transfer ke: <strong>{order.bank.name}</strong> (
                           {order.bank.account_number})
                        </Typography>
                     </Box>
                  )}
               </Box>
            )}

            {/* ── On Progress ── */}
            {order.status === 'on_progress' && (
               <Box
                  sx={{
                     p: 3,
                     bgcolor: 'success.lighter',
                     borderRadius: 2,
                     textAlign: 'center',
                     mb: 3,
                  }}
               >
                  <Iconify
                     icon="solar:check-circle-bold"
                     width={64}
                     sx={{ color: 'success.main', mb: 2 }}
                  />
                  <Typography variant="h6" color="success.darker" gutterBottom>
                     Pembayaran Terkonfirmasi!
                  </Typography>
                  <Typography variant="body2" color="success.darker">
                     Pesanan Anda sedang diproses
                  </Typography>
               </Box>
            )}

            {/* ── Finish ── */}
            {order.status === 'finish' && (
               <Box
                  sx={{
                     p: 3,
                     bgcolor: 'success.lighter',
                     borderRadius: 2,
                     textAlign: 'center',
                     mb: 3,
                  }}
               >
                  <Iconify
                     icon="solar:verified-check-bold"
                     width={64}
                     sx={{ color: 'success.main', mb: 2 }}
                  />
                  <Typography variant="h6" color="success.darker" gutterBottom>
                     Pesanan Selesai
                  </Typography>
                  <Typography variant="body2" color="success.darker">
                     Terima kasih atas pesanan Anda!
                  </Typography>
               </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
               <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => router.push(paths.dashboard.customer_orders.my_orders)}
               >
                  Lihat Pesanan Saya
               </Button>
               <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => router.push(paths.dashboard.customer_orders.catalog)}
               >
                  Belanja Lagi
               </Button>
            </Box>
         </Card>
      </DashboardContent>
   );
}
