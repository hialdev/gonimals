import { paths } from 'src/routes/al/paths';
import AuthGuard from 'src/guards/auth-guard';
import { CheckoutView } from 'src/views/dashboard/checkout/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Checkout` };

export default function Page() {
   return (
      <AuthGuard currentPath={paths.dashboard.customer_orders.checkout}>
         <CheckoutView />
      </AuthGuard>
   );
}
