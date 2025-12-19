'use client'
import { paths } from 'src/routes/al/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PurchaseForm } from '../components/purchase-form';

// ----------------------------------------------------------------------

export function PurchaseCreateView() {
   return (
      <DashboardContent maxWidth="xl">
         <CustomBreadcrumbs
            heading="Create Purchase"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Purchases', href: paths.dashboard.purchases.root },
               { name: 'Create' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <PurchaseForm />
      </DashboardContent>
   );
}
