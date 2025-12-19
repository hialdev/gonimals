'use client';

import { paths } from 'src/routes/al/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductForm } from '../components/form';

// ----------------------------------------------------------------------

export function ProductCreateView() {
   return (
      <DashboardContent>
         <CustomBreadcrumbs
            heading="Create Product"
            links={[
               { name: 'Dashboard', href: paths.dashboard.root },
               { name: 'Products', href: paths.dashboard.products.root },
               { name: 'Create' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
         />

         <ProductForm />
      </DashboardContent>
   );
}
