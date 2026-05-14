'use client';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
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
import { fCurrency } from 'src/utils/format-number';
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

export function SalesAnalyticsView() {
   const theme = useTheme();
   const { getSalesData, salesData } = useDashboardStore();
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         await getSalesData();
         setLoading(false);
      };
      load();
   }, [getSalesData]);

   const chartSeries = salesData?.orders_by_status?.map((item: any) => Number(item.Count)) || [];
   const chartLabels = salesData?.orders_by_status?.map((item: any) => item.Status) || [];

   const chartOptions = useChart({
      colors: [
         theme.palette.info.main,
         theme.palette.warning.main,
         theme.palette.error.main,
         theme.palette.success.main,
         theme.palette.error.dark,
         theme.palette.secondary.main,
      ],
      labels: chartLabels,
      stroke: {
         colors: [theme.palette.background.paper],
      },
      legend: {
         floating: true,
         horizontalAlign: 'center',
      },
      dataLabels: {
         enabled: true,
         dropShadow: {
            enabled: false,
         },
      },
      tooltip: {
         fillSeriesColor: false,
      },
      plotOptions: {
         pie: {
            donut: {
               labels: {
                  show: false,
               },
            },
         },
      },
   });

   if (loading) {
      return <LoadingScreen />;
   }

   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Sales Analytics"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Analytics', href: paths.dashboard.analytics.sales },
               { name: 'Sales' },
            ]}
            action={
               <ExportButton
                  filename="Sales_Analytics_Data"
                  data={
                     salesData?.recent_orders?.map((order: any) => ({
                        'Order ID': order.code || order.id.substring(0, 8),
                        Date: fDateTime(order.created_at),
                        Customer: order.user?.name || '@' + order.user?.username || '-',
                        Total: order.total_bill,
                        Status: order.status,
                     })) || []
                  }
               />
            }
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
               <AnalyticsWidgetSummary
                  title="Total Orders"
                  total={salesData?.total_orders || 0}
                  icon="solar:bag-4-bold-duotone"
                  color="info"
               />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
               <AnalyticsWidgetSummary
                  title="Total Revenue"
                  total={salesData?.total_revenue || 0}
                  currency
                  icon="solar:dollar-minimalistic-bold-duotone"
                  color="success"
               />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
               <AnalyticsWidgetSummary
                  title="Upcoming Revenue"
                  total={salesData?.upcoming_revenue || 0}
                  currency
                  icon="solar:wad-of-money-bold-duotone"
                  color="warning"
               />
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
               <Card>
                  <CardHeader title="Order Status Distribution" />
                  <Chart
                     dir="ltr"
                     type="pie"
                     series={chartSeries}
                     options={chartOptions}
                     sx={{ width: '100%', height: 280 }}
                  />
               </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 8 }}>
               <Card>
                  <CardHeader title="Recent Orders" />
                  <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400 }}>
                     <Table stickyHeader size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell>Order ID</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Customer</TableCell>
                              <TableCell>Total</TableCell>
                              <TableCell>Status</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {salesData?.recent_orders?.map((row: any) => (
                              <TableRow key={row.id}>
                                 <TableCell>{row.code || row.id.substring(0, 8)}</TableCell>
                                 <TableCell>{fDateTime(row.created_at)}</TableCell>
                                 <TableCell>
                                    <Box display="flex" alignItems="center" gap="1">
                                       <Avatar
                                          alt={row.user?.name}
                                          src={
                                             row.user?.image
                                                ? `${process.env.NEXT_PUBLIC_API_HOST}/${row.user.image}`
                                                : ''
                                          }
                                          sx={{ mr: 2, width: 40, height: 40 }}
                                       >
                                          {row.user?.name?.charAt(0).toUpperCase()}
                                       </Avatar>
                                       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                          <Typography variant="subtitle2" noWrap>
                                             @{row.user?.username}
                                          </Typography>
                                       </Box>
                                    </Box>
                                 </TableCell>
                                 <TableCell>{fCurrency(row.total_bill)}</TableCell>
                                 <TableCell>
                                    <Label
                                       color={
                                          (row.status === 'finish' && 'success') ||
                                          (row.status === 'failed' && 'error') ||
                                          (row.status === 'canceled' && 'error') ||
                                          (row.status === 'refunded' && 'error') ||
                                          (row.status === 'stock_issue' && 'info') ||
                                          (row.status === 'on_progress' && 'warning') ||
                                          (row.status === 'waiting_restock' && 'info') ||
                                          'warning'
                                       }
                                    >
                                       {row.status}
                                    </Label>
                                 </TableCell>
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
