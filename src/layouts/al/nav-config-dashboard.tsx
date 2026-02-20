import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/al/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const icon = (name: string) => <Iconify icon={name} />;

// ----------------------------------------------------------------------

/**
 * Input nav data is an array of navigation section items used to define the structure and content of a navigation bar.
 * Each section contains a subheader and an array of items, which can include nested children items.
 *
 * Each item can have the following properties:
 * - `title`: The title of the navigation item.
 * - `path`: The URL path the item links to.
 * - `icon`: An optional icon component to display alongside the title.
 * - `info`: Optional additional information to display, such as a label.
 * - `allowedRoles`: An optional array of roles that are allowed to see the item.
 * - `caption`: An optional caption to display below the title.
 * - `children`: An optional array of nested navigation items.
 * - `disabled`: An optional boolean to disable the item.
 * - `deepMatch`: An optional boolean to indicate if the item should match subpaths.
 */
export const navData: NavSectionProps['data'] = [
   /**
    * Dashboard
    */
   {
      subheader: 'Dashboard',
      items: [
         {
            title: 'Overview',
            path: paths.dashboard.root,
            icon: icon('solar:widget-5-bold-duotone'),
         },
         {
            title: 'Analytics',
            path: paths.dashboard.analytics.sales,
            icon: icon('solar:chart-2-bold-duotone'),
            requiredPermissions: ['Read Dashboard'],
            children: [
               { title: 'Sales', path: paths.dashboard.analytics.sales },
               { title: 'Stock', path: paths.dashboard.analytics.stock },
               { title: 'Purchase', path: paths.dashboard.analytics.purchase },
            ],
         },
      ],
   },
   /**
    * Master Data
    */
   {
      subheader: 'Master Data',
      requiredPermissions: ['Read ProductType', 'Read Product', 'Read Principle'],
      items: [
         {
            title: 'Product Types',
            path: paths.dashboard.product_types.root,
            icon: icon('solar:tag-bold-duotone'),
            requiredPermissions: ['Read ProductType'],
         },
         {
            title: 'Products',
            path: paths.dashboard.products.root,
            icon: icon('solar:box-bold-duotone'),
            requiredPermissions: ['Read Product'],
            children: [
               {
                  title: 'List',
                  path: paths.dashboard.products.root,
                  requiredPermissions: ['Read Product'],
               },
               {
                  title: 'Create',
                  path: paths.dashboard.products.create,
                  requiredPermissions: ['Add Product'],
               },
            ],
         },
         {
            title: 'Principles',
            path: paths.dashboard.principles.root,
            icon: icon('solar:users-group-two-rounded-bold-duotone'),
            requiredPermissions: ['Read Principle'],
         },
         {
            title: 'Banks',
            path: paths.dashboard.banks.root,
            icon: icon('solar:card-bold-duotone'),
            requiredPermissions: ['Add Principle'],
         },
      ],
   },

   /**
    * Purchasing
    */
   {
      subheader: 'Purchasing',
      requiredPermissions: ['Read Purchase', 'Add Purchase', 'Update Purchase', 'Delete Purchase'],
      items: [
         {
            title: 'Purchases',
            path: paths.dashboard.purchases.root,
            icon: icon('solar:cart-large-2-bold-duotone'),
            requiredPermissions: ['Read Purchase'],
            children: [
               {
                  title: 'List',
                  path: paths.dashboard.purchases.root,
                  requiredPermissions: ['Read Purchase'],
               },
               {
                  title: 'Create',
                  path: paths.dashboard.purchases.create,
                  requiredPermissions: ['Add Purchase'],
               },
            ],
         },
         {
            title: 'Adjustments',
            path: paths.dashboard.adjustments.root,
            icon: icon('solar:slider-vertical-bold-duotone'),
            requiredPermissions: ['Read Adjustment'],
         },
         {
            title: 'Stock Movements',
            path: paths.dashboard.stock_movements.root,
            icon: icon('solar:history-bold-duotone'),
            requiredPermissions: ['Read StockMovement'],
         },
      ],
   },
   /**
    * Sales
    */
   {
      subheader: 'Sales',
      requiredPermissions: ['Read Order'],
      items: [
         {
            title: 'Orders',
            path: paths.dashboard.orders.root,
            icon: icon('solar:bag-4-bold-duotone'),
            requiredPermissions: ['Read Order'], // Requires Read Order permission
         },
      ],
   },
   /**
    * Customer Order
    */
   {
      subheader: 'Customer Order',
      items: [
         {
            title: 'Catalog',
            path: paths.dashboard.customer_orders.catalog,
            icon: icon('solar:shop-bold-duotone'),
         },
         {
            title: 'My Orders',
            path: paths.dashboard.customer_orders.my_orders,
            icon: icon('solar:clipboard-list-bold-duotone'),
         },
         {
            title: 'Favorite',
            path: paths.dashboard.customer_orders.favorite,
            icon: icon('solar:heart-bold-duotone'),
         },
      ],
   },
   /**
    * Core Settings
    */
   {
      subheader: 'Core Settings',
      requiredPermissions: ['Read User', 'Read Role', 'Read Permission'],
      items: [
         {
            title: 'User Access',
            path: paths.dashboard.users.root,
            icon: icon('solar:user-bold-duotone'),
            requiredPermissions: ['Read User'],
            children: [
               {
                  title: 'Users',
                  path: paths.dashboard.users.root,
                  requiredPermissions: ['Read User'],
               },
               {
                  title: 'Access Control',
                  path: paths.dashboard.users.access,
                  requiredPermissions: ['Read Role', 'Read Permission', 'Read User'],
               },
            ],
         },
         {
            title: 'Settings',
            path: paths.dashboard.settings,
            icon: icon('solar:settings-minimalistic-bold-duotone'),
            requiredPermissions: ['Read Setting'],
         },
         {
            title: 'Whatsapp Integration',
            path: paths.dashboard.whatsapp,
            icon: icon('solar:smartphone-2-bold-duotone'),
            requiredPermissions: ['Read WhatsappIntegration'],
         },
      ],
   },
];
