import type { Metadata } from 'next';
import { CONFIG } from 'src/global-config';
import AuthGuard from 'src/guards/auth-guard';
import { SalesAnalyticsView } from 'src/views/dashboard/analytics/sales-view';

export const metadata: Metadata = { title: `Sales Analytics - ${CONFIG.appName}` };

export default function Page() {
   return (
      <AuthGuard currentPath="/dashboard/analytics/sales">
         <SalesAnalyticsView />
      </AuthGuard>
   );
}
