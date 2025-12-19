'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { paths } from 'src/routes/al/paths';
import useProductStore from 'src/stores/product';
import { DashboardContent } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductForm } from '../components/form';

// ----------------------------------------------------------------------

export function ProductEditView() {
   const params = useParams();
   const { detail } = useProductStore();
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
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Edit Product"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Products', href: paths.dashboard.products.root },
               { name: 'Edit' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <ProductForm currentProduct={currentData} />
      </DashboardContent>
   );
}
