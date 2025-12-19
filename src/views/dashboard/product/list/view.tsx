'use client';

import type { Product } from 'src/types/product';
import type { TableHeadCellProps } from 'src/components/table';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/al/paths';
import { useRouter } from 'src/routes/hooks';
import useProductStore from 'src/stores/product';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
   useTable,
   TableNoData,
   TableHeadCustom,
   TableSelectedAction,
   TablePaginationCustom,
} from 'src/components/table';

import { ProductTableRow } from '../components/product-table-row';
import { ProductTableToolbar } from '../components/product-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
   { id: 'image', label: 'Image', width: 88 },
   { id: 'product_number', label: 'SKU' },
   { id: 'title', label: 'Product' },
   { id: 'sale_price', label: 'Price', align: 'right' },
   { id: 'stock', label: 'Stock', align: 'center', width: 100 },
   { id: 'is_active', label: 'Status', align: 'center', width: 100 },
   { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ProductListView() {
   const router = useRouter();
   const table = useTable();
   const confirmDialog = useBoolean();
   const { all, delete: destroy } = useProductStore();

   const [tableData, setTableData] = useState<Product[]>([]);
   const [loading, setLoading] = useState<boolean>(true);

   const filters = useSetState({
      search: '',
      isActive: 'all',
      stockSort: '',
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

      let sortBy = table.orderBy;
      let sortOrder = table.order;

      // Handle stock sorting
      if (currentFilters.stockSort === 'lowest') {
         sortBy = 'stock';
         sortOrder = 'asc';
      } else if (currentFilters.stockSort === 'highest') {
         sortBy = 'stock';
         sortOrder = 'desc';
      }

      const params: any = {
         page: table.page + 1,
         limit: table.rowsPerPage,
         sort: sortBy,
         order: sortOrder,
         search: currentFilters.search,
      };

      // Add active status filter
      if (currentFilters.isActive !== 'all') {
         params.is_active = currentFilters.isActive;
      }

      const res = await all(params);

      if (res.success) {
         const { pagination: pgnt, products } = res.data;
         setTableData(products || []);
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

   useEffect(() => {
      fetchData();
   }, [
      table.page,
      table.rowsPerPage,
      table.order,
      table.orderBy,
      currentFilters.search,
      currentFilters.isActive,
      currentFilters.stockSort,
   ]);

   const handleDeleteRow = useCallback(
      async (id: string) => {
         try {
            const result = await destroy({ id });
            if (result.success) {
               toast.success(result.message);
               fetchData();
            }
         } catch (error: any) {
            toast.error('Failed to delete');
         }
      },
      [destroy]
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
               if (result.success) {
                  toast.success(result.message || `Deleted item: ${id}`);
               } else {
                  toast.error(result.message || `Failed to delete: ${id}`);
               }
            } catch (error) {
               toast.error(`Failed to delete: ${id}`);
            }
         }

         fetchData();
         table.onUpdatePageDeleteRows(tableData.length, tableData.length);
      } catch (error) {
         toast.error('An error occurred while deleting!');
      }
   }, [table, tableData.length]);

   const notFound = !tableData.length;

   const renderConfirmDialog = () => (
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
   );

   return (
      <>
         <DashboardContent>
            <CustomBreadcrumbs
               heading="Products"
               links={[
                  { name: 'Dashboard', href: paths.dashboard.root },
                  { name: 'Products', href: paths.dashboard.products.root },
                  { name: 'List' },
               ]}
               action={
                  <Button
                     onClick={() => router.push(paths.dashboard.products.create)}
                     variant="contained"
                     startIcon={<Iconify icon="mingcute:add-line" />}
                  >
                     Add Product
                  </Button>
               }
               sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card>
               <ProductTableToolbar filters={filters} onResetPage={table.onResetPage} />

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
                                 <ProductTableRow
                                    key={row.id}
                                    row={row}
                                    selected={table.selected.includes(row.id!)}
                                    onSelectRow={() => table.onSelectRow(row.id!)}
                                    onDeleteRow={() => handleDeleteRow(row.id!)}
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

         {renderConfirmDialog()}
      </>
   );
}
