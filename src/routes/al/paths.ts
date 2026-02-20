import { kebabCase } from 'es-toolkit';

import { _id, _postTitles } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];
const MOCK_TITLE = _postTitles[2];

const ROOTS = {
   AUTH: '/auth',
   AUTH_DEMO: '/auth-demo',
   DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
   comingSoon: '/coming-soon',
   maintenance: '/maintenance',
   pricing: '/pricing',
   about: '/about-us',
   contact: '/contact-us',
   faqs: '/faqs',
   page403: '/error/403',
   page404: '/error/404',
   page500: '/error/500',
   components: '/components',
   // Auth
   auth: {
      root: ROOTS.AUTH,

      signIn: ROOTS.AUTH + '/sign-in',
      signUp: ROOTS.AUTH + '/sign-up',
      verify: ROOTS.AUTH + '/verify',
      refresh: ROOTS.AUTH + '/refresh',
   },

   // E-Commerce - Public
   catalog: '/catalog',
   cart: '/cart',
   checkout: '/checkout',
   payment: (orderId: string) => `/payment/${orderId}`,

   // DASHBOARD
   dashboard: {
      root: ROOTS.DASHBOARD,

      trip: {
         root: `${ROOTS.DASHBOARD}/trips`,
         create: `${ROOTS.DASHBOARD}/trips/create`,
         update: `${ROOTS.DASHBOARD}/trips/edit`,
      },

      destinations: {
         root: `${ROOTS.DASHBOARD}/destinations`,
         create: `${ROOTS.DASHBOARD}/destinations/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/destinations/${id}/edit`,
      },

      events: {
         root: `${ROOTS.DASHBOARD}/events`,
         create: `${ROOTS.DASHBOARD}/events/create`,
         update: `${ROOTS.DASHBOARD}/events/edit`,
      },

      event_services: {
         root: `${ROOTS.DASHBOARD}/event-services`,
         create: `${ROOTS.DASHBOARD}/event-services/create`,
         update: `${ROOTS.DASHBOARD}/event-services/edit`,
      },

      example_rich: {
         root: `${ROOTS.DASHBOARD}/example-rich`,
         create: `${ROOTS.DASHBOARD}/example-rich/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/example-rich/${id}/edit`,
      },

      // E-Commerce - Master Data
      product_types: {
         root: `${ROOTS.DASHBOARD}/product-types`,
         create: `${ROOTS.DASHBOARD}/product-types/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/product-types/${id}/edit`,
      },

      products: {
         root: `${ROOTS.DASHBOARD}/products`,
         create: `${ROOTS.DASHBOARD}/products/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/products/${id}/edit`,
      },

      principles: {
         root: `${ROOTS.DASHBOARD}/principles`,
         create: `${ROOTS.DASHBOARD}/principles/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/principles/${id}/edit`,
      },

      // E-Commerce - Purchasing
      banks: {
         root: `${ROOTS.DASHBOARD}/banks`,
      },

      purchases: {
         root: `${ROOTS.DASHBOARD}/purchases`,
         create: `${ROOTS.DASHBOARD}/purchases/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/purchases/${id}/edit`,
         detail: (id: string) => `${ROOTS.DASHBOARD}/purchases/${id}`,
      },

      adjustments: {
         root: `${ROOTS.DASHBOARD}/adjustments`,
         create: `${ROOTS.DASHBOARD}/adjustments/create`,
      },

      stock_movements: {
         root: `${ROOTS.DASHBOARD}/stock-movements`,
      },

      // E-Commerce - Sales
      orders: {
         root: `${ROOTS.DASHBOARD}/orders`,
         detail: (id: string) => `${ROOTS.DASHBOARD}/orders/${id}`,
      },

      // E-Commerce - Dashboard
      analytics: {
         sales: `${ROOTS.DASHBOARD}/analytics/sales`,
         stock: `${ROOTS.DASHBOARD}/analytics/stock`,
         purchase: `${ROOTS.DASHBOARD}/analytics/purchase`,
      },

      // Customer Order
      customer_orders: {
         catalog: `${ROOTS.DASHBOARD}/catalog`,
         my_orders: `${ROOTS.DASHBOARD}/my-orders`,
         favorite: `${ROOTS.DASHBOARD}/favorite`,
         checkout: `${ROOTS.DASHBOARD}/checkout`,
         payment: (orderId: string) => `${ROOTS.DASHBOARD}/payment/${orderId}`,
      },

      event_plans: {
         root: `${ROOTS.DASHBOARD}/event-plans`,
         create: `${ROOTS.DASHBOARD}/event-plans/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/event-plans/${id}/edit`,
      },

      faqs: {
         root: `${ROOTS.DASHBOARD}/faqs`,
         create: `${ROOTS.DASHBOARD}/faqs/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/faqs/${id}/edit`,
      },

      teams: {
         root: `${ROOTS.DASHBOARD}/teams`,
         create: `${ROOTS.DASHBOARD}/teams/create`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/teams/${id}/edit`,
      },
      team: `${ROOTS.DASHBOARD}/teams`,
      client: `${ROOTS.DASHBOARD}/clients`,
      testimonial: `${ROOTS.DASHBOARD}/testimonials`,

      account: {
         root: `${ROOTS.DASHBOARD}/my-account`,
         setting: `${ROOTS.DASHBOARD}/my-account?tab=access`,
      },
      // Core Settings
      settings: `${ROOTS.DASHBOARD}/settings`,
      users: {
         root: `${ROOTS.DASHBOARD}/users`,
         new: `${ROOTS.DASHBOARD}/users/new`,
         list: `${ROOTS.DASHBOARD}/users/list`,
         access: `${ROOTS.DASHBOARD}/users/access`,
      },
      whatsapp: `${ROOTS.DASHBOARD}/whatsapp`,
      crud: {
         root: `${ROOTS.DASHBOARD}/crud`,
         new: `${ROOTS.DASHBOARD}/crud/new`,
      },

      // Content Management
      blank: `${ROOTS.DASHBOARD}/blank`,
      kanban: `${ROOTS.DASHBOARD}/kanban`,
      calendar: `${ROOTS.DASHBOARD}/calendar`,
      fileManager: `${ROOTS.DASHBOARD}/file-manager`,
      permission: `${ROOTS.DASHBOARD}/permission`,
      general: {
         app: `${ROOTS.DASHBOARD}/app`,
         ecommerce: `${ROOTS.DASHBOARD}/ecommerce`,
         analytics: `${ROOTS.DASHBOARD}/analytics`,
         banking: `${ROOTS.DASHBOARD}/banking`,
         booking: `${ROOTS.DASHBOARD}/booking`,
         file: `${ROOTS.DASHBOARD}/file`,
         course: `${ROOTS.DASHBOARD}/course`,
      },
      user: {
         root: `${ROOTS.DASHBOARD}/user`,
         new: `${ROOTS.DASHBOARD}/user/new`,
         list: `${ROOTS.DASHBOARD}/user/list`,
         cards: `${ROOTS.DASHBOARD}/user/cards`,
         profile: `${ROOTS.DASHBOARD}/user/profile`,
         account: `${ROOTS.DASHBOARD}/user/account`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
         demo: { edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit` },
      },
      product: {
         root: `${ROOTS.DASHBOARD}/product`,
         new: `${ROOTS.DASHBOARD}/product/new`,
         details: (id: string) => `${ROOTS.DASHBOARD}/product/${id}`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/product/${id}/edit`,
         demo: {
            details: `${ROOTS.DASHBOARD}/product/${MOCK_ID}`,
            edit: `${ROOTS.DASHBOARD}/product/${MOCK_ID}/edit`,
         },
      },
      invoice: {
         root: `${ROOTS.DASHBOARD}/invoice`,
         new: `${ROOTS.DASHBOARD}/invoice/new`,
         details: (id: string) => `${ROOTS.DASHBOARD}/invoice/${id}`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/invoice/${id}/edit`,
         demo: {
            details: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}`,
            edit: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}/edit`,
         },
      },
      post: {
         root: `${ROOTS.DASHBOARD}/post`,
         new: `${ROOTS.DASHBOARD}/post/new`,
         details: (title: string) => `${ROOTS.DASHBOARD}/post/${kebabCase(title)}`,
         edit: (title: string) => `${ROOTS.DASHBOARD}/post/${kebabCase(title)}/edit`,
         demo: {
            details: `${ROOTS.DASHBOARD}/post/${kebabCase(MOCK_TITLE)}`,
            edit: `${ROOTS.DASHBOARD}/post/${kebabCase(MOCK_TITLE)}/edit`,
         },
      },
      order: {
         root: `${ROOTS.DASHBOARD}/order`,
         details: (id: string) => `${ROOTS.DASHBOARD}/order/${id}`,
         demo: { details: `${ROOTS.DASHBOARD}/order/${MOCK_ID}` },
      },
      job: {
         root: `${ROOTS.DASHBOARD}/job`,
         new: `${ROOTS.DASHBOARD}/job/new`,
         details: (id: string) => `${ROOTS.DASHBOARD}/job/${id}`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/job/${id}/edit`,
         demo: {
            details: `${ROOTS.DASHBOARD}/job/${MOCK_ID}`,
            edit: `${ROOTS.DASHBOARD}/job/${MOCK_ID}/edit`,
         },
      },
      tour: {
         root: `${ROOTS.DASHBOARD}/tour`,
         new: `${ROOTS.DASHBOARD}/tour/new`,
         details: (id: string) => `${ROOTS.DASHBOARD}/tour/${id}`,
         edit: (id: string) => `${ROOTS.DASHBOARD}/tour/${id}/edit`,
         demo: {
            details: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}`,
            edit: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}/edit`,
         },
      },
   },
};
