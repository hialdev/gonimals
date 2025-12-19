import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';

export interface OrderLogStatusData {
   id?: string;
   created_at?: string;
   updated_at?: string;
   order_id?: string;
   status?: string;
   images?: string; // JSON string of image array
   reason?: string;
   created_by?: string;
}

interface OrderLogStatusState {
   logs: OrderLogStatusData[];

   getByOrderId: ({ orderId }: { orderId: string }) => Promise<any>;
}

const useOrderLogStatusStore = create<OrderLogStatusState>()(
   persist(
      (set, get) => ({
         logs: [],

         getByOrderId: async ({ orderId }) => {
            const response = await protectedApi.get(`/order-log-status?order_id=${orderId}`);
            if (response.data.success && response.data.data) {
               set({ logs: response.data.data });
            }
            return response.data;
         },
      }),
      {
         name: 'order-log-status-store',
         partialize: (state) => ({
            logs: state.logs,
         }),
      }
   )
);

export default useOrderLogStatusStore;
