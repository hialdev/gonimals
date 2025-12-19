import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';
import type { Adjustment } from '../types/adjustment';

export interface AdjustmentData extends Adjustment {}

interface AdjustmentState {
   adjustments: AdjustmentData[];

   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: any }) => Promise<any>;
   update: ({ id, data }: { id: string; data: any }) => Promise<any>;
   finish: ({ id }: { id: string }) => Promise<any>;
   delete: ({ id }: { id: string }) => Promise<any>;
}

const useAdjustmentStore = create<AdjustmentState>()(
   persist(
      (set, get) => ({
         adjustments: [],
         all: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.product_id !== undefined)
                  queryParams.append('product_id', params.product_id);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/adjustments?${queryString}` : '/adjustments';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ adjustments: response.data.data.adjustments || response.data.data });
            }
            return response.data;
         },
         detail: async ({ id }) => {
            const response = await protectedApi.get(`/adjustments/${id}`);
            return response.data;
         },
         add: async ({ data }) => {
            const response = await protectedApi.post(`/adjustments`, data);
            return response.data;
         },
         update: async ({ id, data }) => {
            const response = await protectedApi.post(`/adjustments/${id}`, data);
            return response.data;
         },
         finish: async ({ id }) => {
            const response = await protectedApi.post(`/adjustments/${id}/finish`);
            return response.data;
         },
         delete: async ({ id }) => {
            const response = await protectedApi.delete(`/adjustments/${id}`);
            return response.data;
         },
      }),
      {
         name: 'adjustment-store',
         partialize: (state) => ({
            adjustments: state.adjustments,
         }),
      }
   )
);

export default useAdjustmentStore;
