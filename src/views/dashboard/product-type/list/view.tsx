'use client';

import type { ProductType } from 'src/types/product-type';
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
import useProductTypeStore from 'src/stores/product-type';
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

import { ProductTypeCUForm } from '../forms/product-type-cu-form';
import { ProductTypeTableRow } from '../components/product-type-table-row';
import { ProductTypeTableToolbar } from '../components/product-type-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
   { id: 'image', label: 'Image', width: 88 },
   { id: 'title', label: 'Title' },
   { id: 'slug', label: 'Slug' },
   { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ProductTypeListView() {
   const table = useTable();
   const confirmDialog = useBoolean();
   const addDialog = useBoolean();
   const { all, delete: destroy } = useProductTypeStore();

   const [tableData, setTableData] = useState<ProductType[]>([]);
   const [loading, setLoading] = useState<boolean>(true);

   const filters = useSetState({ search: '' });
   const { state: currentFilters } = filters;

   const [pagination, setPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
   });

   const fetchData = async () => {
      setLoading(true);

      const params = {
         page: table.page + 1,
         limit: table.rowsPerPage,
         sort: table.orderBy,
         order: table.order,
         search: currentFilters.search,
      };

      const res = await all(params);

      if (res.success) {
         const { pagination: pgnt, product_types } = res.data;
         setTableData(product_types || []);
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
   }, [table.page, table.rowsPerPage, table.order, table.orderBy, currentFilters.search]);

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

   const renderFormAdd = () => (
      <ProductTypeCUForm
         open={addDialog.value}
         onSuccess={() => fetchData()}
         onClose={addDialog.onFalse}
      />
   );

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
               heading="Product Types"
               links={[
                  { name: 'Dashboard', href: paths.dashboard.root },
                  { name: 'Product Types', href: paths.dashboard.product_types.root },
                  { name: 'List' },
               ]}
               action={
                  <Button
                     onClick={addDialog.onTrue}
                     variant="contained"
                     startIcon={<Iconify icon="mingcute:add-line" />}
                  >
                     Add Product Type
                  </Button>
               }
               sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card>
               <ProductTypeTableToolbar filters={filters} onResetPage={table.onResetPage} />

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
                                 <ProductTypeTableRow
                                    onSuccessEdit={() => fetchData()}
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
         {renderFormAdd()}
      </>
   );
}
