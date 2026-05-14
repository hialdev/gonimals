'use client';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/al/paths';
import { fCurrency, fNumber } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { LoadingScreen } from 'src/components/loading-screen';
import { Chart, useChart } from 'src/components/chart';
import { Label } from 'src/components/label';
import { ExportButton } from 'src/components/export-button';

import useDashboardStore from 'src/stores/dashboard';
import { AnalyticsWidgetSummary } from './components/widget-summary';

// ----------------------------------------------------------------------

export function StockAnalyticsView() {
   const theme = useTheme();
   const { getStockData, stockData } = useDashboardStore();
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         await getStockData();
         setLoading(false);
      };
      load();
   }, [getStockData]);

   const typeLabels = stockData?.products_by_type?.map((i: any) => i.ProductTypeName) || [];
   const typeStocks = stockData?.products_by_type?.map((i: any) => Number(i.TotalStock)) || [];

   const chartOptions = useChart({
      stroke: { show: false },
      plotOptions: {
         bar: { horizontal: true, barHeight: '30%' },
      },
      xaxis: {
         categories: typeLabels,
      },
      tooltip: {
         y: {
            formatter: (value: number) => fNumber(value),
         },
      },
   });

   const chartSeries = [{ name: 'Total Stock', data: typeStocks }];

   if (loading) {
      return <LoadingScreen />;
   }

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Stock Analytics"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Analytics', href: paths.dashboard.analytics.stock },
               { name: 'Stock' },
            ]}
            action={
               <ExportButton
                  filename="Stock_Analytics_Data"
                  data={
                     stockData?.recent_movements?.map((row: any) => ({
                        Date: fDateTime(row.created_at),
                        Product: row.product?.title || '-',
                        Reference: row.reference_type || '-',
                        Qty: row.qty,
                     })) || []
                  }
               />
            }
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
               <AnalyticsWidgetSummary
                  title="Total Products"
                  total={stockData?.total_products || 0}
                  icon="solar:box-bold-duotone"
                  color="info"
               />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
               <AnalyticsWidgetSummary
                  title="Total Stock Value"
                  total={stockData?.total_stock_value || 0}
                  currency
                  icon="solar:dollar-minimalistic-bold-duotone"
                  color="warning"
               />
            </Grid>

            {/* Low Stock Alert */}
            <Grid size={{ xs: 12, md: 12 }}>
               <Card sx={{ bgcolor: 'error.lighter', color: 'error.darker' }}>
                  <CardHeader title="Low Stock Alert (< 10 items)" />
                  <TableContainer sx={{ p: 2 }}>
                     <Table size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell sx={{ color: 'error.darker' }}>Product Name</TableCell>
                              <TableCell sx={{ color: 'error.darker' }}>Type</TableCell>
                              <TableCell sx={{ color: 'error.darker' }}>Current Stock</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {stockData?.low_stock_products?.length > 0 ? (
                              stockData.low_stock_products.map((row: any) => (
                                 <TableRow key={row.id}>
                                    <TableCell sx={{ color: 'error.dark' }}>{row.title}</TableCell>
                                    <TableCell sx={{ color: 'error.dark' }}>
                                       {row.ProductType?.title}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                                       {row.stock}
                                    </TableCell>
                                 </TableRow>
                              ))
                           ) : (
                              <TableRow>
                                 <TableCell colSpan={3} align="center">
                                    No low stock products
                                 </TableCell>
                              </TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </TableContainer>
               </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
               <Card>
                  <CardHeader title="Stock by Product Type" />
                  <Chart
                     dir="ltr"
                     type="bar"
                     series={chartSeries}
                     options={chartOptions}
                     sx={{ width: '100%', height: 320 }}
                  />
               </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
               <Card>
                  <CardHeader title="Recent Stock Movements" />
                  <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 320 }}>
                     <Table stickyHeader size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Product</TableCell>
                              <TableCell>Reference</TableCell>
                              <TableCell>Qty</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {stockData?.recent_movements?.map((row: any) => (
                              <TableRow key={row.id}>
                                 <TableCell>{fDateTime(row.created_at)}</TableCell>
                                 <TableCell>{row.product?.title || '-'}</TableCell>
                                 <TableCell>
                                    <Label color={row.qty > 0 ? 'success' : 'error'}>
                                       {row.reference_type || '-'}
                                    </Label>
                                 </TableCell>
                                 <TableCell>{row.qty}</TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </TableContainer>
               </Card>
            </Grid>
         </Grid>
      </DashboardContent>
   );
}
