'use client';

import type { Bank } from 'src/types/bank';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import LoadingButton from '@mui/lab/LoadingButton';

import useBankStore from 'src/stores/bank';
import { DashboardContent } from 'src/layouts/dashboard';
import { paths } from 'src/routes/al/paths';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const emptyForm: Partial<Bank> = {
   name: '',
   account_number: '',
   account_name: '',
   logo: '',
   is_active: true,
};

export function BankListView() {
   const { banks, all, add, update, delete: destroy } = useBankStore();
   const formOpen = useBoolean();
   const confirmDialog = useBoolean();

   const [search, setSearch] = useState('');
   const [filterActive, setFilterActive] = useState<string>('');
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [editTarget, setEditTarget] = useState<Bank | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
   const [form, setForm] = useState<Partial<Bank>>(emptyForm);

   const fetchData = useCallback(async () => {
      setLoading(true);
      const params: any = { limit: 200 };
      if (search) params.search = search;
      if (filterActive !== '') params.is_active = filterActive;
      await all(params);
      setLoading(false);
   }, [search, filterActive]);

   useEffect(() => {
      fetchData();
   }, [search, filterActive]);

   const handleOpenAdd = () => {
      setEditTarget(null);
      setForm(emptyForm);
      formOpen.onTrue();
   };

   const handleOpenEdit = (bank: Bank) => {
      setEditTarget(bank);
      setForm({
         name: bank.name || '',
         account_number: bank.account_number || '',
         account_name: bank.account_name || '',
         logo: bank.logo || '',
         is_active: bank.is_active ?? true,
      });
      formOpen.onTrue();
   };

   const handleSave = async () => {
      if (!form.name || !form.account_number || !form.account_name) {
         toast.error('Nama bank, nomor rekening, dan nama pemilik wajib diisi');
         return;
      }
      setSaving(true);
      try {
         const result = editTarget
            ? await update({ id: editTarget.id!, data: form })
            : await add({ data: form });

         if (result.success) {
            toast.success(editTarget ? 'Bank berhasil diupdate' : 'Bank berhasil ditambahkan');
            formOpen.onFalse();
            fetchData();
         } else {
            toast.error(result.message || 'Gagal menyimpan bank');
         }
      } catch {
         toast.error('Terjadi kesalahan');
      }
      setSaving(false);
   };

   const handleDeleteClick = (bank: Bank) => {
      setDeleteTarget(bank);
      confirmDialog.onTrue();
   };

   const handleDelete = async () => {
      if (!deleteTarget) return;
      try {
         const result = await destroy({ id: deleteTarget.id! });
         if (result.success) {
            toast.success('Bank berhasil dihapus');
            fetchData();
         } else {
            toast.error(result.message || 'Gagal menghapus bank');
         }
      } catch {
         toast.error('Terjadi kesalahan');
      }
      confirmDialog.onFalse();
   };

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Banks"
            links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Banks' }]}
            action={
               <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={handleOpenAdd}
               >
                  Add Bank
               </Button>
            }
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         {/* Filters */}
         <Card sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
               <TextField
                  size="small"
                  label="Cari nama bank..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ minWidth: 240 }}
                  InputProps={{
                     startAdornment: (
                        <InputAdornment position="start">
                           <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                     ),
                  }}
               />
               <Stack direction="row" spacing={1}>
                  {[
                     { label: 'Semua', value: '' },
                     { label: 'Aktif', value: 'true' },
                     { label: 'Nonaktif', value: 'false' },
                  ].map((opt) => (
                     <Button
                        key={opt.value}
                        size="small"
                        variant={filterActive === opt.value ? 'contained' : 'outlined'}
                        color={filterActive === opt.value ? 'primary' : 'inherit'}
                        onClick={() => setFilterActive(opt.value)}
                     >
                        {opt.label}
                     </Button>
                  ))}
               </Stack>
            </Stack>
         </Card>

         {/* Table */}
         <Card>
            <Scrollbar>
               <Table size="medium" sx={{ minWidth: 600 }}>
                  <TableHead>
                     <TableRow>
                        <TableCell>Nama Bank</TableCell>
                        <TableCell>No. Rekening</TableCell>
                        <TableCell>Atas Nama</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Aksi</TableCell>
                     </TableRow>
                  </TableHead>
                  <TableBody>
                     {loading ? (
                        <TableRow>
                           <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                              <Typography color="text.secondary">Memuat...</Typography>
                           </TableCell>
                        </TableRow>
                     ) : banks.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                              <Typography color="text.secondary">Tidak ada data</Typography>
                           </TableCell>
                        </TableRow>
                     ) : (
                        banks.map((bank) => (
                           <TableRow key={bank.id} hover>
                              <TableCell>
                                 <Typography variant="subtitle2">{bank.name}</Typography>
                              </TableCell>
                              <TableCell>{bank.account_number}</TableCell>
                              <TableCell>{bank.account_name}</TableCell>
                              <TableCell align="center">
                                 <Chip
                                    label={bank.is_active ? 'Aktif' : 'Nonaktif'}
                                    color={bank.is_active ? 'success' : 'default'}
                                    size="small"
                                    variant="soft"
                                 />
                              </TableCell>
                              <TableCell align="right">
                                 <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <Tooltip title="Edit">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleOpenEdit(bank)}
                                       >
                                          <Iconify icon="solar:pen-bold" />
                                       </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Hapus">
                                       <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteClick(bank)}
                                       >
                                          <Iconify icon="solar:trash-bin-trash-bold" />
                                       </IconButton>
                                    </Tooltip>
                                 </Stack>
                              </TableCell>
                           </TableRow>
                        ))
                     )}
                  </TableBody>
               </Table>
            </Scrollbar>
         </Card>

         {/* Add / Edit Dialog */}
         <Dialog open={formOpen.value} onClose={formOpen.onFalse} maxWidth="sm" fullWidth>
            <DialogTitle>{editTarget ? 'Edit Bank' : 'Tambah Bank'}</DialogTitle>
            <DialogContent>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <TextField
                     label="Nama Bank"
                     fullWidth
                     required
                     value={form.name || ''}
                     onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <TextField
                     label="Nomor Rekening"
                     fullWidth
                     required
                     value={form.account_number || ''}
                     onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                  />
                  <TextField
                     label="Atas Nama"
                     fullWidth
                     required
                     value={form.account_name || ''}
                     onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                  />
                  <TextField
                     label="Logo URL (opsional)"
                     fullWidth
                     value={form.logo || ''}
                     onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                     helperText="URL logo bank (opsional)"
                  />
                  <FormControlLabel
                     control={
                        <Switch
                           checked={form.is_active ?? true}
                           onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                        />
                     }
                     label="Aktif"
                  />
               </Box>
            </DialogContent>
            <DialogActions>
               <Button onClick={formOpen.onFalse} color="inherit">
                  Batal
               </Button>
               <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
                  Simpan
               </LoadingButton>
            </DialogActions>
         </Dialog>

         {/* Delete Confirm */}
         <ConfirmDialog
            open={confirmDialog.value}
            onClose={confirmDialog.onFalse}
            title="Hapus Bank"
            content={
               <>
                  Yakin ingin menghapus bank <strong>{deleteTarget?.name}</strong>?
               </>
            }
            action={
               <Button variant="contained" color="error" onClick={handleDelete}>
                  Hapus
               </Button>
            }
         />
      </DashboardContent>
   );
}
