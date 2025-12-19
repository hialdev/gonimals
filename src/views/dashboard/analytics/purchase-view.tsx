'use client';

import { useState, useEffect } from 'react';

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
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { LoadingScreen } from 'src/components/loading-screen';
import { Chart, useChart } from 'src/components/chart';
import { Label } from 'src/components/label';

import useDashboardStore from 'src/stores/dashboard';
import { AnalyticsWidgetSummary } from './components/widget-summary';
import { Grid } from '@mui/material';

// ----------------------------------------------------------------------

export function PurchaseAnalyticsView() {
   const theme = useTheme();
   const { getPurchaseData, purchaseData } = useDashboardStore();
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         await getPurchaseData();
         setLoading(false);
      };
      load();
   }, [getPurchaseData]);

   const chartSeries =
      purchaseData?.purchases_by_status?.map((item: any) => Number(item.Count)) || [];
   const chartLabels = purchaseData?.purchases_by_status?.map((item: any) => item.Status) || [];

   const chartOptions = useChart({
      colors: [
         theme.palette.info.main,
         theme.palette.success.main,
         theme.palette.warning.main,
         theme.palette.error.main,
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
         y: {
            formatter: (value: number) => fCurrency(value),
            title: {
               formatter: (seriesName: string) => `${seriesName}`,
            },
         },
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
            heading="Purchase Analytics"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Analytics', href: paths.dashboard.analytics.purchase },
               { name: 'Purchase' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
               <AnalyticsWidgetSummary
                  title="Total Purchases"
                  total={purchaseData?.total_purchases || 0}
                  icon="solar:cart-large-2-bold-duotone"
                  color="info"
               />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
               <AnalyticsWidgetSummary
                  title="Total Expenditures"
                  total={purchaseData?.total_purchase_value || 0}
                  currency
                  icon="solar:bill-list-bold-duotone"
                  color="warning"
               />
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
               <Card>
                  <CardHeader title="Purchase Status" />
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
                  <CardHeader title="Recent Purchases" />
                  <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400 }}>
                     <Table stickyHeader size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Principle</TableCell>
                              <TableCell>Total</TableCell>
                              <TableCell>Status</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {purchaseData?.recent_purchases?.map((row: any) => (
                              <TableRow key={row.id}>
                                 <TableCell>{fDateTime(row.created_at)}</TableCell>
                                 <TableCell>{row.Principle?.name || '-'}</TableCell>
                                 <TableCell>{fCurrency(row.total_price)}</TableCell>
                                 <TableCell>
                                    <Label
                                       color={
                                          (row.status === 'completed' && 'success') ||
                                          (row.status === 'cancelled' && 'error') ||
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
