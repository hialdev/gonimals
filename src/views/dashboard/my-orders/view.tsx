'use client';

import type { Order } from 'src/types/order';

import { useState, useEffect } from 'react';
import { useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/al/paths';

import useOrderStore from 'src/stores/order';
import useAuthStore from 'src/stores/auth';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
   useTable,
   TableNoData,
   TableHeadCustom,
   TablePaginationCustom,
} from 'src/components/table';
import type { TableHeadCellProps } from 'src/components/table';

import { OrderTableRow } from './components/order-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
   { id: 'order_number', label: 'Order Number' },
   { id: 'created_at', label: 'Date', width: 180 },
   { id: 'status', label: 'Status', width: 150 },
   { id: 'total_bill', label: 'Total', width: 150 },
   { id: '', width: 88 },
];

const STATUS_OPTIONS = [
   { value: '', label: 'All Status' },
   { value: 'waiting_payment', label: 'Waiting Payment' },
   { value: 'waiting_confirmation', label: 'Waiting Confirmation' },
   { value: 'on_progress', label: 'On Progress' },
   { value: 'finish', label: 'Finish' },

   { value: 'stock_issue', label: 'Stock Issue' },
   { value: 'waiting_restock', label: 'Waiting Restock' },
   { value: 'refund_pending', label: 'Refund Pending' },
   { value: 'refunded', label: 'Refunded' },
];

// ----------------------------------------------------------------------

export function MyOrdersView() {
   const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });
   const { getMyOrders } = useOrderStore();
   // Auth store no longer needed for ID access here

   const [tableData, setTableData] = useState<Order[]>([]);
   const [loading, setLoading] = useState<boolean>(true);

   const [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
   });

   const filters = useSetState({
      search: '',
      status: '',
      sortPrice: '',
   });

   const { state: currentFilters, setState: updateFilters } = filters;
   const [debouncedSearch] = useDebounce(currentFilters.search, 500);

   const fetchData = async () => {
      setLoading(true);

      const params: any = {
         page: table.page + 1,
         limit: table.rowsPerPage,
         search: debouncedSearch || '',
      };

      if (currentFilters.status) {
         params.status = currentFilters.status;
      }

      // Sort by price if selected
      if (currentFilters.sortPrice) {
         params.sort = 'total_bill';
         params.order = currentFilters.sortPrice;
      } else {
         params.sort = table.orderBy;
         params.order = table.order;
      }

      const res = await getMyOrders(params);

      if (res.success) {
         const { pagination: pgnt, orders } = res.data;
         setTableData(orders || []);
         setPagination({
            page: pgnt.page,
            limit: pgnt.limit,
            total: pgnt.total,
            totalPages: pgnt.totalPages,
         });
      } else {
         toast.error('Gagal memuat data pesanan');
      }

      setLoading(false);
   };

   useEffect(() => {
      fetchData();
   }, [
      table.page,
      table.rowsPerPage,
      table.order,
      table.orderBy,
      debouncedSearch,
      currentFilters.status,
      currentFilters.sortPrice,
   ]);

   const notFound = tableData.length === 0;

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="My Orders"
            links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'My Orders' }]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Card>
            {/* Filters */}
            <Box sx={{ p: 2.5 }}>
               <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                     <TextField
                        fullWidth
                        value={currentFilters.search}
                        onChange={(e) => {
                           updateFilters({ search: e.target.value });
                           table.onResetPage();
                        }}
                        placeholder="Search by order number..."
                        size="small"
                     />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                     <TextField
                        fullWidth
                        select
                        value={currentFilters.status}
                        onChange={(e) => {
                           updateFilters({ status: e.target.value });
                           table.onResetPage();
                        }}
                        size="small"
                        label="Status"
                     >
                        {STATUS_OPTIONS.map((option) => (
                           <MenuItem key={option.value} value={option.value}>
                              {option.label}
                           </MenuItem>
                        ))}
                     </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                     <TextField
                        fullWidth
                        select
                        value={currentFilters.sortPrice}
                        onChange={(e) => {
                           updateFilters({ sortPrice: e.target.value });
                           table.onResetPage();
                        }}
                        size="small"
                        label="Sort by Price"
                     >
                        <MenuItem value="">Default</MenuItem>
                        <MenuItem value="asc">Price: Low to High</MenuItem>
                        <MenuItem value="desc">Price: High to Low</MenuItem>
                     </TextField>
                  </Grid>
               </Grid>
            </Box>

            {loading ? (
               <LoadingScreen />
            ) : (
               <Box sx={{ position: 'relative' }}>
                  <Scrollbar>
                     <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                        <TableHeadCustom
                           order={table.order}
                           orderBy={table.orderBy}
                           headCells={TABLE_HEAD}
                           onSort={table.onSort}
                        />

                        <TableBody>
                           {tableData.map((row) => (
                              <OrderTableRow key={row.id} row={row} onActionSuccess={fetchData} />
                           ))}

                           {pagination.totalPages === 0 && <TableNoData notFound={notFound} />}
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
                  fetchData();
               }}
               onRowsPerPageChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  table.onChangeRowsPerPage(e as any);
                  setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                  table.onResetPage();
                  fetchData();
               }}
               onChangeDense={table.onChangeDense}
               labelDisplayedRows={({ from, to }) =>
                  `${pagination.page} of ${pagination.totalPages} (${from}-${to} of ${pagination.total})`
               }
            />
         </Card>
      </DashboardContent>
   );
}
