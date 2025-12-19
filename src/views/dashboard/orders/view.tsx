'use client';

import type { Order } from 'src/types/order';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/al/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
   useTable,
   emptyRows,
   TableNoData,
   TableEmptyRows,
   TableHeadCustom,
   TablePaginationCustom,
   type TableHeadCellProps,
} from 'src/components/table';

import useOrderStore from 'src/stores/order';
import { OrderTableRow } from './components/order-table-row';
import { useDebounce, useSetState } from 'minimal-shared/hooks';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
   { id: 'order_number', label: 'Order Number' },
   { id: 'created_at', label: 'Date' },
   { id: 'status', label: 'Status' },
   { id: 'total_bill', label: 'Total' },
   { id: 'actions', label: '', align: 'right' },
];

const STATUS_OPTIONS = [
   { value: '', label: 'All Status' },
   { value: 'waiting_payment', label: 'Waiting Payment' },
   { value: 'on_progress', label: 'On Progress' },
   { value: 'finish', label: 'Finished' },
   { value: 'stock_issue', label: 'Stock Issue' },
   { value: 'waiting_restock', label: 'Waiting Restock' },
   { value: 'refund_pending', label: 'Refund Pending' },
   { value: 'refunded', label: 'Refunded' },
   { value: 'canceled', label: 'Canceled' },
];

// ----------------------------------------------------------------------

export function OrdersView() {
   const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });
   const { all } = useOrderStore();

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
   });

   const { state: currentFilters, setState: updateFilters } = filters;
   const [debouncedSearch] = useDebounce(currentFilters.search, 500);

   const fetchData = useCallback(async () => {
      setLoading(true);

      const params: any = {
         page: table.page + 1,
         limit: table.rowsPerPage,
         search: debouncedSearch || '',
      };

      if (currentFilters.status) {
         params.status = currentFilters.status;
      }

      params.sort = table.orderBy;
      params.order = table.order;

      const res = await all(params);

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
         toast.error('Failed to load orders');
      }

      setLoading(false);
   }, [
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      debouncedSearch,
      currentFilters.status,
      all,
   ]);

   useEffect(() => {
      fetchData();
   }, [fetchData]);

   const notFound = !loading && !tableData.length;

   return (
      <DashboardContent maxWidth="xl">
         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header */}
            <Box>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Iconify icon="solar:clipboard-list-bold" width={32} />
                  <Box>
                     <Box sx={{ typography: 'h4' }}>Orders Management</Box>
                     <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
                        Manage all customer orders
                     </Box>
                  </Box>
               </Box>
            </Box>

            {/* Filters */}
            <Card>
               <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                     fullWidth
                     value={currentFilters.search}
                     onChange={(e) => updateFilters({ search: e.target.value })}
                     placeholder="Search by order number..."
                     InputProps={{
                        startAdornment: (
                           <InputAdornment position="start">
                              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                           </InputAdornment>
                        ),
                     }}
                     sx={{ maxWidth: 320 }}
                  />

                  <TextField
                     select
                     value={currentFilters.status}
                     onChange={(e) => updateFilters({ status: e.target.value })}
                     sx={{ minWidth: 200 }}
                  >
                     {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                           {option.label}
                        </MenuItem>
                     ))}
                  </TextField>
               </Box>
            </Card>

            {/* Table */}
            <Card>
               {loading ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                     <Box sx={{ typography: 'body2', color: 'text.secondary' }}>Loading...</Box>
                  </Box>
               ) : (
                  <Box>
                     <TableContainer sx={{ overflow: 'unset' }}>
                        <Scrollbar>
                           <Table sx={{ minWidth: 800 }}>
                              <TableHeadCustom
                                 order={table.order}
                                 orderBy={table.orderBy}
                                 headCells={TABLE_HEAD}
                                 rowCount={tableData.length}
                                 onSort={table.onSort}
                              />

                              <TableBody>
                                 {tableData.map((row) => (
                                    <OrderTableRow
                                       key={row.id}
                                       row={row}
                                       onActionSuccess={fetchData}
                                    />
                                 ))}

                                 <TableEmptyRows
                                    height={table.dense ? 56 : 76}
                                    emptyRows={emptyRows(
                                       table.page,
                                       table.rowsPerPage,
                                       pagination.total
                                    )}
                                 />

                                 {pagination.totalPages === 0 && (
                                    <TableNoData notFound={notFound} />
                                 )}
                              </TableBody>
                           </Table>
                        </Scrollbar>
                     </TableContainer>

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
                        }}
                     />
                  </Box>
               )}
            </Card>
         </Box>
      </DashboardContent>
   );
}
