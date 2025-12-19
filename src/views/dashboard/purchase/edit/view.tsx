'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { paths } from 'src/routes/al/paths';
import usePurchaseStore from 'src/stores/purchase';
import { DashboardContent } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PurchaseForm } from '../components/purchase-form';

// ----------------------------------------------------------------------

export function PurchaseEditView() {
   const params = useParams();
   const { detail } = usePurchaseStore();
   const [currentData, setCurrentData] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchData = async () => {
         const result = await detail({ id: params.id as string });
         if (result.success) {
            setCurrentData(result.data);
         }
         setLoading(false);
      };
      fetchData();
   }, [params.id]);

   if (loading) return <LoadingScreen />;

   return (
      <DashboardContent maxWidth="xl">
         <CustomBreadcrumbs
            heading="Edit Purchase"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Purchases', href: paths.dashboard.purchases.root },
               { name: 'Edit' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <PurchaseForm currentPurchase={currentData} />
      </DashboardContent>
   );
}
