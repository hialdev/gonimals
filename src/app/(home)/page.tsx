import type { Metadata } from 'next';

import { HomeView } from 'src/views/home/view/home-view';

// ----------------------------------------------------------------------

export const metadata = {
   title: 'Gonimals - Home',
   description: 'Welcome to Gonimals. Explore our best animal products and supplies.',
};

export default function Page() {
   return <HomeView />;
}
