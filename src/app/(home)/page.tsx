import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { paths } from 'src/routes/al/paths';


// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'RKG Tour and Travel Dashbaord',
  description:
    'This is an Admin Dashsboard for RKG Tour and Travel, manage all contents of official sites and web apps',
};

export default function Page() {
  return redirect(paths.dashboard.root);
}
    