import type { Metadata } from 'next';
import { CONFIG } from 'src/global-config';
import AuthGuard from 'src/guards/auth-guard';
import { StockAnalyticsView } from 'src/views/dashboard/analytics/stock-view';

export const metadata: Metadata = { title: `Stock Analytics - ${CONFIG.appName}` };

export default function Page() {
   return (
      <AuthGuard currentPath="/dashboard/analytics/stock">
         <StockAnalyticsView />
      </AuthGuard>
   );
}
