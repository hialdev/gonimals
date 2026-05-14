'use client';

import type { StockMovement } from 'src/types/stock-movement';
import type { TableHeadCellProps } from 'src/components/table';

import { useState, useEffect } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/al/paths';
import useStockMovementStore from 'src/stores/stock-movement';
import { DashboardContent } from 'src/layouts/dashboard';
import { exportToExcel, exportToCSV } from 'src/utils/export-data';
import dayjs from 'dayjs';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ExportButton } from 'src/components/export-button';
import {
   useTable,
   TableNoData,
   TableHeadCustom,
   TablePaginationCustom,
} from 'src/components/table';

import { StockMovementTableRow } from '../components/stock-movement-table-row';
import { StockMovementTableToolbar } from '../components/stock-movement-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
   { id: 'created_at', label: 'Date & Time' },
   { id: 'product', label: 'Product' },
   { id: 'reference_type', label: 'Type', align: 'center' },
   { id: 'qty', label: 'Quantity', align: 'center' },
   { id: 'description', label: 'Description' },
   { id: 'reference_id', label: 'Reference' },
];

// ----------------------------------------------------------------------

export function StockMovementListView() {
   const table = useTable();
   const { all } = useStockMovementStore();

   const [tableData, setTableData] = useState<StockMovement[]>([]);
   const [loading, setLoading] = useState<boolean>(true);

   const filters = useSetState({
      search: '',
      product_id: '',
      reference_type: '',
   });
   const { state: currentFilters } = filters;

   const [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
   });

   const fetchData = async () => {
      setLoading(true);

      const params: any = {
         page: table.page + 1,
         limit: table.rowsPerPage,
         sort: table.orderBy,
         order: table.order,
      };

      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.product_id) params.product_id = currentFilters.product_id;
      if (currentFilters.reference_type) params.reference_type = currentFilters.reference_type;

      const res = await all(params);

      if (res.success) {
         const { pagination: pgnt, stock_movements } = res.data;
         setTableData(stock_movements || []);
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
   };

   const handleExport = async (format: 'excel' | 'csv') => {
      try {
         const params: any = {
            page: 1,
            limit: 10000,
            sort: table.orderBy,
            order: table.order,
         };

         if (currentFilters.search) params.search = currentFilters.search;
         if (currentFilters.product_id) params.product_id = currentFilters.product_id;
         if (currentFilters.reference_type) params.reference_type = currentFilters.reference_type;

         const res = await all(params);

         if (res.success) {
            const stockMovements = res.data.stock_movements || [];
            if (stockMovements.length === 0) {
               toast.error('No data to export');
               return;
            }

            const flatData = stockMovements.map((item: any) => ({
               'Date & Time': item.created_at ? dayjs(item.created_at).format('DD MMM YYYY HH:mm') : '-',
               'Product Title': item.product?.title || '-',
               'Product SKU': item.product?.sku || '-',
               'Type': item.reference_type || '-',
               'Quantity': item.qty || 0,
               'Description': item.description || '-',
               'Reference ID': item.reference_id || '-',
            }));

            if (format === 'excel') {
               exportToExcel(flatData, 'StockMovements_Data');
            } else {
               exportToCSV(flatData, 'StockMovements_Data');
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
   }, [
      table.page,
      table.rowsPerPage,
      table.order,
      table.orderBy,
      currentFilters.search,
      currentFilters.product_id,
      currentFilters.reference_type,
   ]);

   const notFound = !tableData.length;

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Stock Movements"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Stock Movements', href: paths.dashboard.stock_movements.root },
               { name: 'List' },
            ]}
            action={<ExportButton onExport={handleExport} />}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Card>
            <StockMovementTableToolbar filters={filters} onResetPage={table.onResetPage} />

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
                           rowCount={tableData.length}
                           onSort={table.onSort}
                        />

                        <TableBody>
                           {tableData.map((row) => (
                              <StockMovementTableRow key={row.id} row={row} />
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
