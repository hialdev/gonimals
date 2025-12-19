import { PaymentView } from 'src/views/dashboard/payment/[orderId]/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Payment` };

export default function Page() {
   return <PaymentView />;
}
