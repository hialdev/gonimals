'use client';

import type { Purchase } from 'src/types/purchase';
import type { Principle } from 'src/types/principle';
import type { TableHeadCellProps } from 'src/components/table';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';

import { paths } from 'src/routes/al/paths';
import { useRouter } from 'src/routes/hooks';
import usePurchaseStore from 'src/stores/purchase';
import usePrincipleStore from 'src/stores/principle';
import { DashboardContent } from 'src/layouts/dashboard';
import { exportToExcel, exportToCSV } from 'src/utils/export-data';
import dayjs from 'dayjs';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ExportButton } from 'src/components/export-button';
import {
   useTable,
   TableNoData,
   TableHeadCustom,
   TableSelectedAction,
   TablePaginationCustom,
} from 'src/components/table';

import { PurchaseTableRow } from '../components/purchase-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
   { id: 'purchase_date', label: 'Date' },
   { id: 'principle', label: 'Supplier' },
   { id: 'items', label: 'Items' },
   { id: 'total', label: 'Total', align: 'right' },
   { id: 'notes', label: 'Notes' },
   { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function PurchaseListView() {
   const router = useRouter();
   const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });
   const confirmDialog = useBoolean();
   const { all, delete: destroy } = usePurchaseStore();
   const { all: allPrinciples, principles } = usePrincipleStore();

   const [tableData, setTableData] = useState<Purchase[]>([]);
   const [loading, setLoading] = useState<boolean>(true);
   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

   // Filter state
   const [search, setSearch] = useState('');
   const [selectedSuppliers, setSelectedSuppliers] = useState<Principle[]>([]);
   const [startDate, setStartDate] = useState<Dayjs | null>(null);
   const [endDate, setEndDate] = useState<Dayjs | null>(null);

   // Load principles for the supplier autocomplete
   useEffect(() => {
      allPrinciples({ limit: 200 });
   }, []);

   const fetchData = useCallback(
      async (overridePage?: number) => {
         setLoading(true);

         const params: any = {
            page: overridePage ?? table.page + 1,
            limit: table.rowsPerPage,
            sort: table.orderBy || 'created_at',
            order: table.order || 'desc',
         };

         if (search.trim()) params.search = search.trim();
         if (selectedSuppliers.length > 0)
            params.principle_ids = selectedSuppliers.map((s) => s.id).join(',');
         if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
         if (endDate) params.end_date = endDate.format('YYYY-MM-DD');

         const res = await all(params);

         if (res.success) {
            const { pagination: pgnt, purchases } = res.data;
            setTableData(purchases || []);
            setPagination({
               page: pgnt.page,
               limit: pgnt.limit,
               total: pgnt.total,
               totalPages: pgnt.totalPages,
            });
         } else {
            toast.error('Failed to load data');
         }

         setLoading(false);
      },
      [
         table.page,
         table.rowsPerPage,
         table.order,
         table.orderBy,
         search,
         selectedSuppliers,
         startDate,
         endDate,
      ]
   );

   const handleExport = async (format: 'excel' | 'csv') => {
      try {
         const params: any = {
            page: 1,
            limit: 10000, // fetch all
            sort: table.orderBy || 'created_at',
            order: table.order || 'desc',
         };

         if (search.trim()) params.search = search.trim();
         if (selectedSuppliers.length > 0)
            params.principle_ids = selectedSuppliers.map((s) => s.id).join(',');
         if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
         if (endDate) params.end_date = endDate.format('YYYY-MM-DD');

         const res = await all(params);

         if (res.success) {
            const purchases = res.data.purchases || [];
            if (purchases.length === 0) {
               toast.error('No data to export');
               return;
            }

            const flatData = purchases.flatMap((purchase: any) => {
               if (!purchase.purchase_products || purchase.purchase_products.length === 0) {
                  return [{
                     'Purchase Number': purchase.purchase_number,
                     'Purchase Date': purchase.purchase_date ? dayjs(purchase.purchase_date).format('DD MMM YYYY') : '-',
                     'Expected Arrival': purchase.expected_arrival_date ? dayjs(purchase.expected_arrival_date).format('DD MMM YYYY') : '-',
                     'Status': purchase.status,
                     'Is Clear': purchase.is_clear ? 'Yes' : 'No',
                     'Supplier Name': purchase.principle?.title || '-',
                     'Total Price': purchase.total_price || 0,
                     'Notes': purchase.notes || '-',
                     'Product Name': '-',
                     'Product SKU': '-',
                     'Qty Ordered': 0,
                     'Qty Received': 0,
                     'Qty Remaining': 0,
                     'Purchase Price': 0,
                     'Subtotal': 0
                  }];
               }

               return purchase.purchase_products.map((item: any) => ({
                  'Purchase Number': purchase.purchase_number,
                  'Purchase Date': purchase.purchase_date ? dayjs(purchase.purchase_date).format('DD MMM YYYY') : '-',
                  'Expected Arrival': purchase.expected_arrival_date ? dayjs(purchase.expected_arrival_date).format('DD MMM YYYY') : '-',
                  'Status': purchase.status,
                  'Is Clear': purchase.is_clear ? 'Yes' : 'No',
                  'Supplier Name': purchase.principle?.title || '-',
                  'Total Price': purchase.total_price || 0,
                  'Notes': purchase.notes || '-',
                  'Product Name': item.product?.title || '-',
                  'Product SKU': item.product?.sku || '-',
                  'Qty Ordered': item.qty || 0,
                  'Qty Received': item.received_qty || 0,
                  'Qty Remaining': item.remaining_qty || 0,
                  'Purchase Price': item.purchase_price || 0,
                  'Subtotal': item.subtotal || 0
               }));
            });

            if (format === 'excel') {
               exportToExcel(flatData, 'Purchases_Data');
            } else {
               exportToCSV(flatData, 'Purchases_Data');
            }
         } else {
            toast.error('Failed to load data for export');
         }
      } catch (error) {
         toast.error('Export failed');
         console.error(error);
      }
   };

   useEffect(() => {
      fetchData();
   }, [table.page, table.rowsPerPage, table.order, table.orderBy]);

   const handleApplyFilter = () => {
      table.onResetPage();
      fetchData(1);
   };

   const handleClearFilter = () => {
      setSearch('');
      setSelectedSuppliers([]);
      setStartDate(null);
      setEndDate(null);
      table.onResetPage();
      // Trigger fetch after state clears
      setTimeout(() => fetchData(1), 0);
   };

   const hasActiveFilter =
      search !== '' || selectedSuppliers.length > 0 || startDate !== null || endDate !== null;

   const handleDeleteRow = useCallback(
      async (id: string) => {
         try {
            const result = await destroy({ id });
            if (result.success) {
               toast.success(result.message);
               fetchData();
            }
         } catch {
            toast.error('Failed to delete');
         }
      },
      [destroy, fetchData]
   );

   const handleDeleteRows = useCallback(async () => {
      if (table.selected.length === 0) {
         toast.info('No data selected!');
         return;
      }
      try {
         for (const id of table.selected) {
            try {
               const result = await destroy({ id });
               if (!result.success) toast.error(result.message || `Failed to delete: ${id}`);
            } catch {
               toast.error(`Failed to delete: ${id}`);
            }
         }
         fetchData();
         table.onUpdatePageDeleteRows(tableData.length, tableData.length);
      } catch {
         toast.error('An error occurred while deleting!');
      }
   }, [table, tableData.length, fetchData]);

   const notFound = !tableData.length;

   return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
         <>
            <DashboardContent>
               <CustomBreadcrumbs
                  heading="Purchases"
                  links={[
                     { name: 'Dashboard', href: paths.dashboard.root },
                     { name: 'Purchases', href: paths.dashboard.purchases.root },
                     { name: 'List' },
                  ]}
                  action={
                     <Stack direction="row" spacing={1}>
                        <ExportButton onExport={handleExport} />
                        <Button
                           onClick={() => router.push(paths.dashboard.purchases.create)}
                           variant="contained"
                           startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                           New Purchase
                        </Button>
                     </Stack>
                  }
                  sx={{ mb: { xs: 3, md: 5 } }}
               />

               {/* ─── Filter Bar ─────────────────────────── */}
               <Card sx={{ p: 2, mb: 2 }}>
                  <Stack
                     direction={{ xs: 'column', md: 'row' }}
                     spacing={2}
                     alignItems={{ xs: 'stretch', md: 'flex-start' }}
                  >
                     {/* Text search (notes) */}
                     <TextField
                        size="small"
                        label="Cari catatan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') handleApplyFilter();
                        }}
                        sx={{ minWidth: 200 }}
                        InputProps={{
                           startAdornment: (
                              <InputAdornment position="start">
                                 <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                              </InputAdornment>
                           ),
                        }}
                     />

                     {/* Supplier multi-select */}
                     <Autocomplete
                        multiple
                        size="small"
                        options={principles}
                        value={selectedSuppliers}
                        onChange={(_, newValue) => setSelectedSuppliers(newValue)}
                        getOptionLabel={(option) => option.title || ''}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        sx={{ minWidth: 260 }}
                        renderInput={(params) => <TextField {...params} label="Pilih Supplier" />}
                        renderTags={(tagValue, getTagProps) =>
                           tagValue.map((option, index) => (
                              <Chip
                                 {...getTagProps({ index })}
                                 key={option.id}
                                 label={option.title}
                                 size="small"
                              />
                           ))
                        }
                     />

                     {/* Start Date */}
                     <DatePicker
                        label="Dari Tanggal"
                        value={startDate}
                        onChange={(val) => setStartDate(val)}
                        slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
                     />

                     {/* End Date */}
                     <DatePicker
                        label="Sampai Tanggal"
                        value={endDate}
                        onChange={(val) => setEndDate(val)}
                        minDate={startDate || undefined}
                        slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
                     />

                     {/* Action buttons */}
                     <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                           variant="contained"
                           size="small"
                           onClick={handleApplyFilter}
                           startIcon={<Iconify icon="eva:search-fill" />}
                        >
                           Filter
                        </Button>
                        {hasActiveFilter && (
                           <Button
                              variant="outlined"
                              size="small"
                              color="inherit"
                              onClick={handleClearFilter}
                              startIcon={<Iconify icon="solar:close-circle-bold" />}
                           >
                              Reset
                           </Button>
                        )}
                     </Stack>
                  </Stack>
               </Card>

               {/* ─── Table ──────────────────────────────── */}
               <Card>
                  {loading ? (
                     <LoadingScreen />
                  ) : (
                     <Box sx={{ position: 'relative' }}>
                        <TableSelectedAction
                           dense={table.dense}
                           numSelected={table.selected.length}
                           rowCount={tableData.length}
                           onSelectAllRows={(checked) =>
                              table.onSelectAllRows(
                                 checked,
                                 tableData.map((row) => row.id!)
                              )
                           }
                           action={
                              <Tooltip title="Delete">
                                 <IconButton color="primary" onClick={confirmDialog.onTrue}>
                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                 </IconButton>
                              </Tooltip>
                           }
                        />

                        <Scrollbar>
                           <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                              <TableHeadCustom
                                 order={table.order}
                                 orderBy={table.orderBy}
                                 headCells={TABLE_HEAD}
                                 rowCount={tableData.length}
                                 numSelected={table.selected.length}
                                 onSort={table.onSort}
                                 onSelectAllRows={(checked) =>
                                    table.onSelectAllRows(
                                       checked,
                                       tableData.map((row) => row.id!)
                                    )
                                 }
                              />

                              <TableBody>
                                 {tableData.map((row) => (
                                    <PurchaseTableRow
                                       key={row.id}
                                       row={row}
                                       selected={table.selected.includes(row.id!)}
                                       onSelectRow={() => table.onSelectRow(row.id!)}
                                       onDeleteRow={() => handleDeleteRow(row.id!)}
                                       onRefresh={fetchData}
                                    />
                                 ))}

                                 {notFound && <TableNoData notFound={notFound} />}
                              </TableBody>
                           </Table>
                        </Scrollbar>
                     </Box>
                  )}

                  <TablePaginationCustom
                     page={pagination.page - 1}
                     dense={table.dense}
                     count={pagination.total}
                     rowsPerPage={pagination.limit}
                     onPageChange={(e, newPage) => {
                        table.onChangePage(e, newPage);
                        fetchData(newPage + 1);
                     }}
                     onRowsPerPageChange={(e) => {
                        const newLimit = parseInt(e.target.value, 10);
                        table.onChangeRowsPerPage(e as any);
                        setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                        table.onResetPage();
                        fetchData(1);
                     }}
                     onChangeDense={table.onChangeDense}
                     labelDisplayedRows={({ from, to }) =>
                        `${pagination.page} of ${pagination.totalPages} (${from}-${to} of ${pagination.total})`
                     }
                  />
               </Card>
            </DashboardContent>

            <ConfirmDialog
               open={confirmDialog.value}
               onClose={confirmDialog.onFalse}
               title="Delete"
               content={
                  <>
                     Are you sure want to delete <strong>{table.selected.length}</strong> items?
                  </>
               }
               action={
                  <Button
                     variant="contained"
                     color="error"
                     onClick={() => {
                        handleDeleteRows();
                        confirmDialog.onFalse();
                     }}
                  >
                     Delete
                  </Button>
               }
            />
         </>
      </LocalizationProvider>
   );
}
