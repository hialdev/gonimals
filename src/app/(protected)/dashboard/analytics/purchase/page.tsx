import type { Metadata } from 'next';
import { CONFIG } from 'src/global-config';
import AuthGuard from 'src/guards/auth-guard';
import { PurchaseAnalyticsView } from 'src/views/dashboard/analytics/purchase-view';

export const metadata: Metadata = { title: `Purchase Analytics - ${CONFIG.appName}` };

export default function Page() {
   return (
      <AuthGuard currentPath="/dashboard/analytics/purchase">
         <PurchaseAnalyticsView />
      </AuthGuard>
   );
}
