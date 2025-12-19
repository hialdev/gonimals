'use client';

import type { Purchase } from 'src/types/purchase';
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
import usePurchaseStore from 'src/stores/purchase';
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
   const table = useTable();
   const confirmDialog = useBoolean();
   const { all, delete: destroy } = usePurchaseStore();

   const [tableData, setTableData] = useState<Purchase[]>([]);
   const [loading, setLoading] = useState<boolean>(true);

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
      };

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
   };

   useEffect(() => {
      fetchData();
   }, [table.page, table.rowsPerPage, table.order, table.orderBy]);

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
               heading="Purchases"
               links={[
                  { name: 'Dashboard', href: paths.dashboard.root },
                  { name: 'Purchases', href: paths.dashboard.purchases.root },
                  { name: 'List' },
               ]}
               action={
                  <Button
                     onClick={() => router.push(paths.dashboard.purchases.create)}
                     variant="contained"
                     startIcon={<Iconify icon="mingcute:add-line" />}
                  >
                     New Purchase
                  </Button>
               }
               sx={{ mb: { xs: 3, md: 5 } }}
            />

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
