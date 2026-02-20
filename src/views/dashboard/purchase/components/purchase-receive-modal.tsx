'use client';

import type { Purchase } from 'src/types/purchase';

import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { Typography } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { CONFIG } from 'src/global-config';
import usePurchaseStore from 'src/stores/purchase';
import { fDate } from 'src/utils/format-time';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface ReceiveLog {
   id: string;
   received_date: string;
   items: {
      id: string;
      product_id: string;
      product?: { title?: string; image?: string };
      received_qty: number;
   }[];
}

const ReceiveSchema = z.object({
   received_date: z.string().min(1, { message: 'Received Date is required!' }),
   products: z
      .array(
         z.object({
            product_id: z.string(),
            qty_to_receive: z.coerce.number().min(0, { message: 'Min 0' }),
         })
      )
      .min(1),
});

type ReceiveFormType = z.infer<typeof ReceiveSchema>;

type Props = {
   open: boolean;
   onClose: () => void;
   purchase: Purchase;
   onRefresh?: () => void;
};

export function PurchaseReceiveModal({ open, onClose, purchase, onRefresh }: Props) {
   const { receive, getLogs, detail } = usePurchaseStore();
   const [loading, setLoading] = useState(false);
   const [logs, setLogs] = useState<ReceiveLog[]>([]);
   const [logsLoading, setLogsLoading] = useState(false);

   // Local purchase state — seeded from prop, but updated immediately from receive API response
   // This ensures remaining qty is always accurate without waiting for parent to re-fetch
   const [localPurchase, setLocalPurchase] = useState<Purchase>(purchase);

   // Sync local state ONLY when a different purchase row is opened.
   // Do NOT sync on modal open/close — that would overwrite fresh post-receive data
   // with the stale prop value (parent list may not have refreshed yet).
   useEffect(() => {
      setLocalPurchase(purchase);
   }, [purchase.id]); // eslint-disable-line react-hooks/exhaustive-deps

   // Deduplicate by product_id to prevent double-render if backend returns duplicates
   const seen = new Set<string>();
   const products = (localPurchase.purchase_products || []).filter((p) => {
      const key = p.product_id || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
   });

   const fetchLogs = async () => {
      if (!localPurchase.id) return;
      setLogsLoading(true);
      try {
         const res = await getLogs({ id: localPurchase.id });
         if (res.success && res.data) setLogs(res.data);
      } catch {
         // silently ignore
      } finally {
         setLogsLoading(false);
      }
   };

   // Fetch logs whenever modal opens
   useEffect(() => {
      if (open) fetchLogs();
   }, [open, purchase.id]); // eslint-disable-line react-hooks/exhaustive-deps

   const methods = useForm<ReceiveFormType>({
      mode: 'onSubmit',
      resolver: zodResolver(ReceiveSchema) as any,
      // `values` is reactive — resets form when products list changes (e.g. after receive)
      values: {
         received_date: new Date().toISOString().split('T')[0],
         products: products.map((p) => ({
            product_id: p.product_id || '',
            qty_to_receive: 0,
         })),
      },
   });

   const {
      handleSubmit,
      reset,
      watch,
      formState: { isSubmitting },
   } = methods;

   const watchedProducts = watch('products');

   const handleClose = () => {
      reset();
      setLogs([]);
      setLocalPurchase(purchase);
      onClose();
   };

   const onSubmit = handleSubmit(async (data) => {
      // Filter out products where qty_to_receive is 0
      const productsToReceive = data.products.filter((p) => p.qty_to_receive > 0);

      if (productsToReceive.length === 0) {
         toast.error('Masukkan qty yang akan diterima untuk setidaknya 1 produk');
         return;
      }

      setLoading(true);
      try {
         const payload = {
            received_date: new Date(data.received_date).toISOString(),
            products: productsToReceive.map((p) => ({
               product_id: p.product_id,
               qty_to_receive: p.qty_to_receive,
            })),
         };

         const result = await receive({ id: localPurchase.id!, data: payload });

         if (result.success) {
            toast.success(result.message || 'Receive recorded successfully');
            // Re-fetch the full purchase detail from backend to get fresh remaining_qty
            const freshDetail = await detail({ id: localPurchase.id! });
            if (freshDetail.success && freshDetail.data) {
               setLocalPurchase(freshDetail.data);
            } else if (result.data) {
               // Fallback to receive response data
               setLocalPurchase(result.data);
            }
            // Refresh the parent list in background
            if (onRefresh) onRefresh();
            // Re-fetch logs to show new entry
            await fetchLogs();
            // Reset the qty_to_receive inputs back to 0
            reset();
         } else {
            toast.error(result.message || 'Failed to record receive');
         }
      } catch (error: any) {
         toast.error(error?.response?.data?.message || 'An error occurred');
      } finally {
         setLoading(false);
      }
   });

   const isCompleted = localPurchase.is_clear === true;

   return (
      <Dialog
         fullWidth
         maxWidth="md"
         open={open}
         onClose={handleClose}
         PaperProps={{
            sx: { borderRadius: 2 },
         }}
      >
         <DialogTitle>
            Receive Purchase
            <Box
               component="span"
               sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  fontWeight: 400,
               }}
            >
               {purchase.purchase_number}
            </Box>
         </DialogTitle>

         <DialogContent sx={{ pb: 3 }}>
            <Stack spacing={3}>
               {/* ─── Receive Form ──────────────────────────── */}
               {!isCompleted ? (
                  <Form methods={methods} onSubmit={onSubmit}>
                     <Stack spacing={2}>
                        <Box sx={{ maxWidth: 320 }}>
                           <Field.DatePicker name="received_date" label="Received Date" />
                        </Box>

                        {/* Product cards: show remaining qty, input for this batch */}
                        {products.map((product, index) => {
                           // Use backend-computed remaining_qty as source of truth
                           const remaining =
                              product.remaining_qty ??
                              (product.qty || 0) - (product.received_qty || 0);
                           const thisQty = watchedProducts?.[index]?.qty_to_receive ?? 0;

                           return (
                              <Card
                                 key={product.id || product.product_id}
                                 sx={{
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    border: '1px solid',
                                    borderColor: remaining === 0 ? 'success.light' : 'divider',
                                    bgcolor:
                                       remaining === 0 ? 'success.lighter' : 'background.paper',
                                 }}
                              >
                                 {product?.product?.image && (
                                    <Avatar
                                       src={`${CONFIG.apiHostUrl}/${product.product.image}`}
                                       variant="rounded"
                                       sx={{ width: 56, height: 56 }}
                                    />
                                 )}

                                 <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" noWrap>
                                       {product?.product?.title || 'Unknown Product'}
                                    </Typography>
                                    <Stack
                                       direction="row"
                                       spacing={1}
                                       sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
                                    >
                                       <Chip
                                          size="small"
                                          label={`Dipesan: ${product.qty}`}
                                          color="default"
                                          variant="outlined"
                                       />
                                       <Chip
                                          size="small"
                                          label={`Diterima: ${product.received_qty || 0}`}
                                          color="info"
                                          variant="outlined"
                                       />
                                       <Chip
                                          size="small"
                                          label={
                                             remaining === 0 ? 'Lengkap ✓' : `Sisa: ${remaining}`
                                          }
                                          color={remaining === 0 ? 'success' : 'warning'}
                                          variant={remaining === 0 ? 'filled' : 'outlined'}
                                       />
                                    </Stack>
                                 </Box>

                                 {remaining > 0 ? (
                                    <Box sx={{ width: 140 }}>
                                       <Field.Text
                                          name={`products.${index}.qty_to_receive`}
                                          label="Terima sekarang"
                                          type="number"
                                          helperText={
                                             thisQty > remaining
                                                ? `Max ${remaining}`
                                                : `Max ${remaining}`
                                          }
                                          InputProps={{
                                             inputProps: { min: 0, max: remaining },
                                          }}
                                       />
                                    </Box>
                                 ) : (
                                    <Iconify
                                       icon="solar:check-circle-bold"
                                       width={28}
                                       sx={{ color: 'success.main' }}
                                    />
                                 )}
                              </Card>
                           );
                        })}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                           <Button variant="outlined" color="inherit" onClick={handleClose}>
                              Batal
                           </Button>
                           <Button
                              type="submit"
                              variant="contained"
                              loading={isSubmitting || loading}
                              startIcon={<Iconify icon="solar:box-bold" />}
                           >
                              Simpan Penerimaan
                           </Button>
                        </Box>
                     </Stack>
                  </Form>
               ) : (
                  <Card
                     sx={{
                        p: 2,
                        bgcolor: 'success.lighter',
                        border: '1px solid',
                        borderColor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                     }}
                  >
                     <Iconify
                        icon="solar:check-circle-bold"
                        sx={{ color: 'success.main' }}
                        width={24}
                     />
                     <Typography variant="body2" color="success.dark">
                        Purchase ini sudah selesai dan semua barang telah diterima.
                     </Typography>
                  </Card>
               )}

               {/* ─── Receive History Log ───────────────────── */}
               <Box>
                  <Divider sx={{ mb: 2 }}>
                     <Typography variant="caption" color="text.secondary">
                        Riwayat Penerimaan
                     </Typography>
                  </Divider>

                  {logsLoading ? (
                     <Stack spacing={1}>
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="rounded" height={60} />
                     </Stack>
                  ) : logs.length === 0 ? (
                     <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ py: 2 }}
                     >
                        Belum ada riwayat penerimaan
                     </Typography>
                  ) : (
                     <Stack spacing={1.5}>
                        {logs.map((log) => (
                           <Card
                              key={log.id}
                              sx={{
                                 p: 2,
                                 border: '1px solid',
                                 borderColor: 'divider',
                                 bgcolor: 'background.neutral',
                              }}
                           >
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                 <Iconify
                                    icon="solar:inbox-in-bold"
                                    width={18}
                                    sx={{ color: 'primary.main' }}
                                 />
                                 <Typography variant="subtitle2">
                                    {fDate(log.received_date)}
                                 </Typography>
                              </Stack>

                              <Stack spacing={0.5}>
                                 {log.items?.map((item) => (
                                    <Stack
                                       key={item.id}
                                       direction="row"
                                       alignItems="center"
                                       justifyContent="space-between"
                                    >
                                       <Stack direction="row" spacing={1} alignItems="center">
                                          {item.product?.image && (
                                             <Avatar
                                                src={`${CONFIG.apiHostUrl}/${item.product.image}`}
                                                variant="rounded"
                                                sx={{ width: 28, height: 28 }}
                                             />
                                          )}
                                          <Typography variant="body2">
                                             {item.product?.title || item.product_id}
                                          </Typography>
                                       </Stack>
                                       <Chip
                                          size="small"
                                          label={`+${item.received_qty}`}
                                          color="primary"
                                          variant="outlined"
                                       />
                                    </Stack>
                                 ))}
                              </Stack>
                           </Card>
                        ))}
                     </Stack>
                  )}
               </Box>
            </Stack>
         </DialogContent>
      </Dialog>
   );
}
